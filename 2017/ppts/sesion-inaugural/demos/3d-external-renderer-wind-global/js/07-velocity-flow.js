define(["require", "exports", "esri/request", "esri/Map", "esri/core/requireUtils", "esri/geometry/Extent", "esri/views/SceneView", "esri/views/3d/externalRenderers", "./support/widgets"], function (require, exports, request, Map, requireUtils, Extent, SceneView, externalRenderers, widgets_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var view;
    var ParticleSystem = (function () {
        function ParticleSystem(properties) {
            // Settings
            this.numParticlesInTrail = 32;
            this.numParticleStreams = 1024 * 1024 / this.numParticlesInTrail;
            this.useLines = true;
            this.timestep = 1 / 60;
            // Precomputed
            this.totalNumParticles = this.numParticleStreams * this.numParticlesInTrail;
            this.particlePotSize = 1 << Math.ceil(Math.log(Math.sqrt(this.totalNumParticles)) / Math.LN2);
            // Particle simulation
            this.time = 0;
            this.gl = properties.gl;
            this.view = properties.view;
            this.extent = properties.extent;
            this.velocityFieldTexture = properties.velocityField;
            this.reprojectionTexture = properties.reprojection;
            this.initializeResources();
        }
        /**
         * Initialize all the GPU resources for running the particle
         * simulation and rendering the particles.
         */
        ParticleSystem.prototype.initializeResources = function () {
            this.initializeSimulationFBO();
            // this.initializeRenderFBO();
            this.initializeQuadGeometryVBO();
            this.initializeParticleGeometryVBO();
            this.initializePrograms();
            this.initializeParticles();
        };
        /**
         * Creates the FBO used to run the simulation.
         */
        ParticleSystem.prototype.initializeSimulationFBO = function () {
            var gl = this.gl;
            this.simulationFBO = gl.createFramebuffer();
        };
        ParticleSystem.prototype.createRenderTexture = function () {
            var gl = this.gl;
            var renderTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, renderTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.view.width, this.view.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            return renderTexture;
        };
        /**
         * Initialize the VBO geometry used to run the particle simulation.
         * This is simply a quad (using a triangle strip) which covers the
         * texture that contains the particle state.
         */
        ParticleSystem.prototype.initializeQuadGeometryVBO = function () {
            var gl = this.gl;
            this.quadGeometryVBO = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadGeometryVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
        };
        /**
         * Initialize attributes in a VBO buffer for a single particle.
         */
        ParticleSystem.prototype.initializeParticleAttributes = function (particleData, i, offset) {
            var x = i % this.particlePotSize;
            var y = Math.floor(i / this.particlePotSize);
            particleData[offset + 0] = (x + 0.5) / this.particlePotSize;
            particleData[offset + 1] = (y + 0.5) / this.particlePotSize;
            particleData[offset + 2] = (i % this.numParticleStreams) / this.numParticleStreams * 2 * Math.PI;
            particleData[offset + 3] = (Math.floor(i / this.numParticleStreams) + 1) / this.numParticlesInTrail;
        };
        /**
         * Create VBO containing geometry attributes for rendering particles. Particles
         * may be rendered either as points or as connected lines, depending on useLines.
         */
        ParticleSystem.prototype.initializeParticleGeometryVBO = function () {
            if (this.useLines) {
                this.initializeParticleVBOLines();
            }
            else {
                this.initializeParticleVBOPoints();
            }
        };
        /**
         * Create VBO containing geometry attributes for rendering particles
         * as lines.
         */
        ParticleSystem.prototype.initializeParticleVBOLines = function () {
            var gl = this.gl;
            var vertexPairs = (this.numParticlesInTrail - 1) * 2;
            var particleData = new Float32Array(vertexPairs * this.numParticleStreams * 4);
            var ptr = 0;
            for (var i = 0; i < this.numParticleStreams; i++) {
                for (var j = 0; j < this.numParticlesInTrail - 1; j++) {
                    var idx = j * this.numParticleStreams + i;
                    var nextIdx = idx + this.numParticleStreams;
                    this.initializeParticleAttributes(particleData, idx, ptr);
                    ptr += 4;
                    this.initializeParticleAttributes(particleData, nextIdx, ptr);
                    ptr += 4;
                }
            }
            this.particleGeometryVBO = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleGeometryVBO);
            gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.STATIC_DRAW);
        };
        /**
         * Create VBO containing geometry attributes for rendering particles
         * as points.
         */
        ParticleSystem.prototype.initializeParticleVBOPoints = function () {
            var gl = this.gl;
            var particleData = new Float32Array(this.totalNumParticles * 4);
            var ptr = 0;
            for (var i = 0; i < this.totalNumParticles; i++) {
                this.initializeParticleAttributes(particleData, i, ptr);
                ptr += 4;
            }
            this.particleGeometryVBO = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleGeometryVBO);
            gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.STATIC_DRAW);
        };
        ParticleSystem.prototype.initializePrograms = function () {
            this.programs = {
                update: {
                    program: this.createProgram("update", 
                    // Vertex shader
                    "\n            precision highp float;\n\n            attribute vec3 pos;\n            varying vec3 particlePosition;\n\n            void main() {\n              particlePosition = pos;\n              gl_Position = vec4((pos.xy * 2.0) - 1.0, 0, 1);\n            }\n          ", 
                    // Fragment shader
                    "\n            precision highp float;\n            precision highp sampler2D;\n\n            varying vec3 particlePosition;\n\n            uniform sampler2D particles;\n\n            //uniform sampler2D velocityFieldX;\n            //uniform sampler2D velocityFieldY;\n            uniform sampler2D velocityField;\n            uniform sampler2D particleOriginsTexture;\n\n            uniform float timestep;\n            uniform float time;\n\n            // uniform float velocityOffset;\n            // uniform float velocityScale;\n\n            uniform vec2 velocityOffset;\n            uniform vec2 velocityScale;\n\n            const float trailSize = float(" + this.numParticlesInTrail + ");\n\n            float random(vec2 co) {\n              return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n            }\n\n            float rgba2float(vec4 rgba) {\n\t\t          return dot(rgba, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\t          }\n\n            void main() {\n              vec4 particle = texture2D(particles, particlePosition.xy);\n\n              // Check if particle is even alive\n              if (particle.z < 0.0) {\n                if (-particle.z <= time) {\n                  // Should become alive and die after some time\n                  particle.z = time;\n                }\n              }\n              // Check if particle is now dead\n              else {\n                float lifeSpan = 10.0 + random(vec2(particle.z, -particle.z)) * 10.0;\n                float elapsed = time - particle.z;\n                float remaining = lifeSpan - elapsed;\n\n                float delay = timestep * trailSize * 5.0;\n\n                if (elapsed >= lifeSpan) {\n                  // Reposition it on the grid, based on some randomization\n                  particle.xy = texture2D(particleOriginsTexture, particlePosition.xy).xy;\n\n                  // Create a random time-to-life\n                  particle.z = -(time + 1.0 + random(particle.xy + vec2(time, time)) * 2.0);\n                }\n                // Otherwise just update the particle position according to the velocity field\n                else if (elapsed > particle.w * delay && remaining > (1.0 - particle.w) * delay) {\n                  vec2 velocity = texture2D(velocityField, particle.xy).xy * velocityScale + velocityOffset;\n\n                  const float velocityTimeScale = 0.0005;\n                  vec2 vupdate = vec2(velocity.x, -velocity.y) * timestep * velocityTimeScale;\n\n                  particle.xy += vupdate;\n                }\n              }\n\n              gl_FragColor = particle;\n            }\n          "),
                    uniforms: null
                },
                render: {
                    program: this.createProgram("render", 
                    // Vertex shader
                    "\n            precision highp float;\n            precision highp sampler2D;\n\n            uniform sampler2D particles;\n\n            uniform sampler2D reprojectionX;\n            uniform sampler2D reprojectionY;\n            uniform sampler2D reprojectionZ;\n\n            uniform float reprojectionOffset;\n            uniform float reprojectionScale;\n\n            uniform mat4 viewMatrix;\n            uniform mat4 projectionMatrix;\n            uniform float time;\n\n\n            attribute vec2 position;\n            attribute float age;\n\n            varying float fAge;\n            varying vec4 particle;\n\n            float rgba2float(vec4 rgba) {\n\t\t          return dot(rgba, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\t          }\n\n            float random(vec2 co) {\n              return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n            }\n\n            void main() {\n              particle = texture2D(particles, position);\n\n              float lifeSpan = 10.0 + random(vec2(particle.z, -particle.z)) * 5.0;\n              float elapsed = time - particle.z;\n              float remaining = lifeSpan - elapsed;\n\n              fAge = smoothstep(0.0, 2.0, remaining) * (age + 0.5) * 0.75;\n\n              gl_PointSize = 1.0 + fAge;\n\n              if (particle.z < 0.0) {\n                // Not alive, clip?\n                gl_Position = vec4(-2, -2, -2, 1);\n              }\n              else {\n                vec4 posX = texture2D(reprojectionX, particle.xy);\n                vec4 posY = texture2D(reprojectionY, particle.xy);\n                vec4 posZ = texture2D(reprojectionZ, particle.xy);\n\n                vec3 pos = vec3(rgba2float(posX), rgba2float(posY), rgba2float(posZ)) * reprojectionScale + reprojectionOffset;\n\n                vec4 ndcPos = projectionMatrix * viewMatrix * vec4(pos, 1);\n\n                // Add a constant z-bias to push the points towards the viewer, so\n                // we don't z-fight with the terrain\n                ndcPos.z -= 0.0001 * ndcPos.w;\n\n                gl_Position = ndcPos;\n              }\n            }\n          ", 
                    // Fragment shader
                    "\n            precision highp float;\n            precision highp sampler2D;\n\n            uniform sampler2D velocityField;\n            uniform float time;\n            uniform vec2 velocityScale;\n            uniform vec2 velocityOffset;\n\n            varying vec4 particle;\n            varying float fAge;\n\n            void main() {\n              vec3 velocity = texture2D(velocityField, particle.xy).xyz;\n              gl_FragColor = vec4(velocity.xyz, fAge);\n            }\n          "),
                    uniforms: null
                }
            };
            this.programs.update.uniforms = this.extractUniforms(this.programs.update.program, [
                "particles", "velocityField", "velocityScale", "velocityOffset", "time", "timestep", "particleOriginsTexture"
            ]);
            this.programs.render.uniforms = this.extractUniforms(this.programs.render.program, [
                "particles", "reprojectionX", "reprojectionY", "reprojectionZ", "reprojectionScale", "reprojectionOffset", "viewMatrix", "projectionMatrix", "velocityField", "velocityScale", "velocityOffset", "time"
            ]);
        };
        ParticleSystem.prototype.extractUniforms = function (program, names) {
            var ret = {};
            var gl = this.gl;
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var name_1 = names_1[_i];
                ret[name_1] = gl.getUniformLocation(program, name_1);
            }
            return ret;
        };
        ParticleSystem.prototype.randomPositionOnSphere = function () {
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos(1 - 2 * Math.random());
            var x = Math.sin(phi) * Math.cos(theta);
            var y = Math.sin(phi) * Math.sin(theta);
            var z = Math.cos(phi);
            var coord = [0, 0, 0];
            externalRenderers.fromRenderCoordinates(this.view, [x * 6378137, y * 6378137, z * 6378137], 0, coord, 0, this.view.spatialReference, 1);
            return [
                (coord[0] - this.extent.xmin) / this.extent.width,
                (coord[1] - this.extent.ymin) / this.extent.height
            ];
        };
        ParticleSystem.prototype.initializeParticles = function () {
            var ptr = 0;
            var particleData = new Float32Array(this.particlePotSize * this.particlePotSize * 4);
            // Generate initial particle positions
            for (var i = 0; i < this.numParticleStreams; i++) {
                var _a = this.randomPositionOnSphere(), x = _a[0], y = _a[1];
                var timeToBirth = Math.random() * 20;
                for (var j = 0; j < this.numParticlesInTrail; j++) {
                    var offset = j * this.numParticleStreams * 4;
                    particleData[ptr + offset + 0] = x;
                    particleData[ptr + offset + 1] = y;
                    // TTB (time to birth), in seconds
                    particleData[ptr + offset + 2] = -timeToBirth;
                    // Normalized trail delay
                    particleData[ptr + offset + 3] = 1 - (j + 1) / this.numParticlesInTrail;
                }
                ptr += 4;
            }
            this.particleOriginsTexture = this.createFloatTexture(particleData, this.particlePotSize);
            this.particleStateTextures = [
                this.createFloatTexture(particleData, this.particlePotSize),
                this.createFloatTexture(null, this.particlePotSize)
            ];
        };
        ParticleSystem.prototype.programLog = function (name, info) {
            if (info) {
                console.error("Failed to compile or link", name, info);
            }
        };
        ParticleSystem.prototype.renderQuadGeometryVBO = function (context) {
            var gl = context.gl;
            // Setup draw geometrysimulationGeometryVBO
            gl.enableVertexAttribArray(0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadGeometryVBO);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
            // Finally, draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        ParticleSystem.prototype.createProgram = function (name, vertex, fragment) {
            var gl = this.gl;
            var program = gl.createProgram();
            var vertexShader = gl.createShader(gl.VERTEX_SHADER);
            var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(vertexShader, vertex);
            gl.compileShader(vertexShader);
            this.programLog(name + " - vertex", gl.getShaderInfoLog(vertexShader));
            gl.shaderSource(fragmentShader, fragment);
            gl.compileShader(fragmentShader);
            this.programLog(name + " - fragment", gl.getShaderInfoLog(fragmentShader));
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            this.programLog(name + " - link program", gl.getProgramInfoLog(program));
            return program;
        };
        ParticleSystem.prototype.createFloatTexture = function (data, size) {
            var gl = this.gl;
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.FLOAT, data);
            return texture;
        };
        ParticleSystem.prototype.update = function (context) {
            this.time += this.timestep;
            var gl = this.gl;
            // Bind input textures
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.particleStateTextures[0]);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.velocityFieldTexture.texture);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.particleOriginsTexture);
            // Setup FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.simulationFBO);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.particleStateTextures[1], 0);
            gl.viewport(0, 0, this.particlePotSize, this.particlePotSize);
            gl.disable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            gl.depthMask(false);
            // Setup program and uniforms
            var program = this.programs.update;
            gl.useProgram(program.program);
            gl.uniform1i(program.uniforms["particles"], 0);
            gl.uniform1i(program.uniforms["velocityField"], 1);
            gl.uniform1i(program.uniforms["particleOriginsTexture"], 2);
            gl.uniform2f(program.uniforms["velocityScale"], this.velocityFieldTexture.scaleU, this.velocityFieldTexture.scaleV);
            gl.uniform2f(program.uniforms["velocityOffset"], this.velocityFieldTexture.offsetU, this.velocityFieldTexture.offsetV);
            gl.uniform1f(program.uniforms["time"], this.time);
            gl.uniform1f(program.uniforms["timestep"], this.timestep);
            this.renderQuadGeometryVBO(context);
            // When update is done, swap the I/O textures
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
            _a = [this.particleStateTextures[1], this.particleStateTextures[0]], this.particleStateTextures[0] = _a[0], this.particleStateTextures[1] = _a[1];
            gl.viewport(0, 0, context.camera.fullWidth, context.camera.fullHeight);
            var _a;
        };
        ParticleSystem.prototype.renderParticles = function (context) {
            var gl = context.gl;
            // Bind input texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.particleStateTextures[0]);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.reprojectionTexture.textures[0]);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.reprojectionTexture.textures[1]);
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this.reprojectionTexture.textures[2]);
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, this.velocityFieldTexture.texture);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.DEPTH_TEST);
            gl.depthMask(false);
            // Setup program and uniforms
            var program = this.programs.render;
            gl.useProgram(program.program);
            gl.uniform1i(program.uniforms["particles"], 0);
            gl.uniform1i(program.uniforms["reprojectionX"], 1);
            gl.uniform1i(program.uniforms["reprojectionY"], 2);
            gl.uniform1i(program.uniforms["reprojectionZ"], 3);
            gl.uniform1i(program.uniforms["velocityField"], 4);
            gl.uniform2f(program.uniforms["velocityScale"], this.velocityFieldTexture.scaleU, this.velocityFieldTexture.scaleV);
            gl.uniform2f(program.uniforms["velocityOffset"], this.velocityFieldTexture.offsetU, this.velocityFieldTexture.offsetV);
            gl.uniform1f(program.uniforms["reprojectionScale"], this.reprojectionTexture.scale);
            gl.uniform1f(program.uniforms["reprojectionOffset"], this.reprojectionTexture.offset);
            gl.uniformMatrix4fv(program.uniforms["viewMatrix"], false, context.camera.viewMatrix);
            gl.uniformMatrix4fv(program.uniforms["projectionMatrix"], false, context.camera.projectionMatrix);
            gl.uniform1f(program.uniforms["time"], this.time);
            gl.uniform1f(program.uniforms["timestep"], this.timestep);
            // Setup draw geometry
            gl.enableVertexAttribArray(0);
            gl.enableVertexAttribArray(1);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleGeometryVBO);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
            // Finally, draw
            if (this.useLines) {
                gl.drawArrays(gl.LINES, 0, (this.numParticlesInTrail - 1) * 2 * this.numParticleStreams);
            }
            else {
                gl.drawArrays(gl.POINTS, 0, this.totalNumParticles);
            }
            gl.disableVertexAttribArray(0);
            gl.disableVertexAttribArray(1);
        };
        ParticleSystem.prototype.render = function (context) {
            context.bindRenderTarget();
            this.renderParticles(context);
            context.resetWebGLState();
        };
        return ParticleSystem;
    }());
    var ExternalRenderer = (function () {
        function ExternalRenderer(view) {
            var _this = this;
            this.view = view;
            this.readyToRender = false;
            this.paused = false;
            this.singleStep = false;
            view.on("hold", function () {
                _this.paused = !_this.paused;
                console.log("paused", _this.paused);
                if (!_this.paused) {
                    externalRenderers.requestRender(view);
                }
            });
            view.on("pointer-up", ["Primary"], function () {
                if (_this.paused) {
                    _this.paused = false;
                    _this.singleStep = true;
                    externalRenderers.requestRender(view);
                }
            });
        }
        ExternalRenderer.prototype.setup = function (context) {
            var _this = this;
            var gl = context.gl;
            gl.getExtension("OES_texture_float");
            this.prepareResources(context)
                .then(function () {
                _this.readyToRender = true;
                externalRenderers.requestRender(_this.view);
                console.log("going to render");
            });
        };
        ExternalRenderer.prototype.renderTransparent = function (context) {
            if (!this.readyToRender) {
                return;
            }
            if (this.particleSystem) {
                if (!this.paused) {
                    this.particleSystem.update(context);
                }
                this.particleSystem.render(context);
                if (this.singleStep) {
                    console.log("stepped");
                    this.paused = true;
                    this.singleStep = false;
                }
            }
            context.resetWebGLState();
            if (!this.paused) {
                externalRenderers.requestRender(this.view);
            }
        };
        ExternalRenderer.prototype.prepareResources = function (context) {
            var _this = this;
            var rasterInfo;
            return this.fetchRaster()
                .then(function (fetchedRaster) {
                rasterInfo = fetchedRaster;
                _this.createTextures(context, fetchedRaster);
            })
                .then(function () {
                _this.createParticleSystem(context, rasterInfo.extent);
            });
        };
        ExternalRenderer.prototype.createParticleSystem = function (context, extent) {
            this.particleSystem = new ParticleSystem({
                gl: context.gl,
                view: this.view,
                extent: extent,
                velocityField: this.velocityField,
                reprojection: this.reprojection
            });
        };
        ExternalRenderer.prototype.encodeFloatRGBA = function (value, rgba, offset) {
            var r = value % 1;
            var g = (value * 255) % 1;
            var b = (value * 65025) % 1;
            var a = (value * 16581375) % 1;
            rgba[offset] = r * 255 - g;
            rgba[offset + 1] = g * 255 - b;
            rgba[offset + 2] = b * 255 - a;
            rgba[offset + 3] = a * 255;
        };
        ExternalRenderer.prototype.decodeFloatRGBA = function (rgba, offset) {
            var r = rgba[offset + 0];
            var g = rgba[offset + 1];
            var b = rgba[offset + 2];
            var a = rgba[offset + 3];
            return r / 255 + g / 65025 + b / 16581375 + a / 4228250625;
        };
        ExternalRenderer.prototype.createReprojectionData = function (extent, resolution) {
            if (resolution === void 0) { resolution = 512; }
            var size = resolution * resolution * 4;
            var normalize = function (value, bounds) {
                return (value - bounds[0]) / (bounds[1] - bounds[0]);
            };
            var reprojectionDatas = [
                new Uint8Array(size),
                new Uint8Array(size),
                new Uint8Array(size)
            ];
            var reprojectionBounds = [-6378137, 6378137];
            var reprojectedPoint = [0, 0, 0];
            // let pixelOffset = 0;
            var byteOffset = 0;
            for (var y = 0; y < resolution; y++) {
                for (var x = 0; x < resolution; x++) {
                    var pt = [
                        extent.xmin + (x + 0.5) / resolution * extent.width,
                        extent.ymax - (y + 0.5) / resolution * extent.height,
                        0
                    ];
                    externalRenderers.toRenderCoordinates(this.view, pt, 0, extent.spatialReference, reprojectedPoint, 0, 1);
                    this.encodeFloatRGBA(normalize(reprojectedPoint[0], reprojectionBounds), reprojectionDatas[0], byteOffset);
                    this.encodeFloatRGBA(normalize(reprojectedPoint[1], reprojectionBounds), reprojectionDatas[1], byteOffset);
                    this.encodeFloatRGBA(normalize(reprojectedPoint[2], reprojectionBounds), reprojectionDatas[2], byteOffset);
                    // pixelOffset++;
                    byteOffset += 4;
                }
            }
            return {
                data: reprojectionDatas,
                bounds: reprojectionBounds,
                resolution: resolution
            };
        };
        ExternalRenderer.prototype.createTextures = function (context, fetchedRaster) {
            var _this = this;
            // Create:
            //   - velocity field texture, X/Y, velocity in m/s
            //   - 3D re-projection texture
            var rasterData = fetchedRaster.rasterData;
            var resolution = rasterData.width;
            var textureDataSize = resolution * resolution * 4 * 2;
            var reprojectionDatas = this.createReprojectionData(fetchedRaster.extent);
            var gl = context.gl;
            this.velocityField = {
                texture: this.createTexture(context.gl, resolution, rasterData, gl.NEAREST),
                offsetU: fetchedRaster.serviceInfo.minValues[0],
                scaleU: fetchedRaster.serviceInfo.maxValues[0] - fetchedRaster.serviceInfo.minValues[0],
                offsetV: fetchedRaster.serviceInfo.minValues[1],
                scaleV: fetchedRaster.serviceInfo.maxValues[1] - fetchedRaster.serviceInfo.minValues[1]
            };
            this.reprojection = {
                textures: reprojectionDatas.data.map(function (data) { return _this.createTexture(context.gl, reprojectionDatas.resolution, data, gl.LINEAR); }),
                offset: reprojectionDatas.bounds[0],
                scale: reprojectionDatas.bounds[1] - reprojectionDatas.bounds[0]
            };
        };
        ExternalRenderer.prototype.createTexture = function (gl, size, data, interpolation) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpolation);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpolation);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
            if (data instanceof Uint8Array) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
            }
            else {
                // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
            }
            return texture;
        };
        ExternalRenderer.prototype.fetchServiceInfo = function (serviceUrl) {
            var options = {
                query: {
                    f: "json"
                }
            };
            return request(serviceUrl, options)
                .then(function (response) { return response.data; });
        };
        // private fetchRasterBands(serviceUrl: string, serviceInfo: ImageServiceInfo, extent: Extent) {
        //   const exportImageParams = {
        //     f: "image",
        //     format: "png",
        //     pixelType: "F32",
        //     interpolation: "RSP_BilinearInterpolation",
        //     bbox: [extent.xmin, extent.ymin, extent.xmax, extent.ymax],
        //     imageSR: this.view.spatialReference.wkid,
        //     bboxSR: extent.spatialReference.wkid,
        //     size: [512, 512]
        //   };
        //   const paramStrings = Object.keys(exportImageParams).map(key => {
        //     const value = exportImageParams[key];
        //     let paramValue: string;
        //     if (typeof value === "string") {
        //       paramValue = value;
        //     }
        //     else if (Array.isArray(value)) {
        //       paramValue = value.join(",");
        //     }
        //     else {
        //       paramValue = JSON.stringify(value);
        //     }
        //     return `${key}=${encodeURIComponent(paramValue)}`
        //   });
        //   const requestOptions: esri.requestEsriRequestOptions = {
        //     responseType: "image",
        //     allowImageDataAccess: true
        //   };
        //   return request(`${serviceUrl}/exportimage?${paramStrings.join("&")}`, requestOptions)
        //       .then((response: any) => {
        //         return response.data;
        //       });
        // }
        // private fetchRaster(): IPromise<FetchedRaster> {
        //   const serviceUrl = "http://zrh-arcgis-ser4.esri.com/server/rest/services/Wind_Global/ImageServer";
        //   const extent = new Extent({
        //     xmin: -20037508.342788905,
        //     xmax: 20037508.342788905,
        //     ymin: -20037508.342788905,
        //     ymax: 20037508.342788905,
        //     spatialReference: 102100
        //   });
        //   let serviceInfo: ImageServiceInfo;
        //   return this.fetchServiceInfo<ImageServiceInfo>(serviceUrl)
        //       .then(info => {
        //         serviceInfo = info;
        //         return this.fetchRasterBands(serviceUrl, serviceInfo, extent);
        //       })
        //       .then((rasterData: any) => {
        //         return {
        //           serviceInfo: serviceInfo,
        //           extent,
        //           rasterData
        //         };
        //       });
        // }
        ExternalRenderer.prototype.fetchRaster = function () {
            var requestOptions = {
                responseType: "image",
                allowImageDataAccess: true
            };
            var serviceInfo = {
                minValues: [-27.309999465942383, -22.420000076293945],
                maxValues: [27.65999984741211, 20.969999313354492]
            };
            var extent = new Extent({
                xmin: -20037508.342788905,
                xmax: 20037508.342788905,
                ymin: -20037508.342788905,
                ymax: 20037508.342788905,
                spatialReference: 102100
            });
            return request("./data/wind-global.png", requestOptions)
                .then(function (response) {
                return {
                    serviceInfo: serviceInfo,
                    extent: extent,
                    rasterData: response.data
                };
            });
        };
        return ExternalRenderer;
    }());
    function initialize() {
        view = new SceneView({
            container: "viewDiv",
            map: new Map({
                basemap: "streets-night-vector"
            }),
            environment: {
                atmosphere: {
                    quality: "high"
                }
            },
            constraints: {
                altitude: {
                    min: 7374827,
                    max: 51025096
                }
            },
            camera: {
                position: [-168.491, 23.648, 19175402.86],
                heading: 360.00,
                tilt: 1.37
            },
            ui: {
                components: ["compass", "attribution"]
            }
        });
        widgets_1.createFullscreen(view);
        requireUtils.when(require, "esri/layers/BaseTileLayer")
            .then(function (BaseTileLayer) {
            var VelocityLayer = BaseTileLayer.createSubclass({
                minScale: 591657527.591555,
                maxScale: 9244648.868618,
                getTileUrl: function (level, row, col) {
                    return "./data/tiles/" + level + "/" + row + "/" + col;
                }
            });
            var layer = new VelocityLayer({
                opacity: 0.5
            });
            view.map.add(layer);
        });
        view.then(function () {
            var renderer = new ExternalRenderer(view);
            externalRenderers.add(view, renderer);
        });
        window["view"] = view;
    }
    exports.initialize = initialize;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDctdmVsb2NpdHktZmxvdy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIjA3LXZlbG9jaXR5LWZsb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7SUEyQkEsSUFBSSxJQUFlLENBQUM7SUFpQnBCO1FBbUNFLHdCQUFZLFVBQW9DO1lBeEJoRCxXQUFXO1lBQ00sd0JBQW1CLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLHVCQUFrQixHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1lBQzVELGFBQVEsR0FBRyxJQUFJLENBQUM7WUFDaEIsYUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFbkMsY0FBYztZQUNHLHNCQUFpQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUM7WUFDdkUsb0JBQWUsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFMUcsc0JBQXNCO1lBQ2QsU0FBSSxHQUFHLENBQUMsQ0FBQztZQWNmLElBQUksQ0FBQyxFQUFFLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBRWhDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDO1lBQ3JELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDO1lBRW5ELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFRDs7O1dBR0c7UUFDSyw0Q0FBbUIsR0FBM0I7WUFDRSxJQUFJLENBQUMs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