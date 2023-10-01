!(function (t, e) {
    "object" == typeof exports && "undefined" != typeof module
        ? e(exports, require("three"))
        : "function" == typeof define && define.amd
        ? define(["exports", "three"], e)
        : e(((t = "undefined" != typeof globalThis ? globalThis : t || self).GCodePreview = {}), t.THREE);
})(this, function (t, e) {
    "use strict";
    function n(t, e, n, i) {
        return new (n || (n = Promise))(function (o, a) {
            function s(t) {
                try {
                    l(i.next(t));
                } catch (t) {
                    a(t);
                }
            }
            function r(t) {
                try {
                    l(i.throw(t));
                } catch (t) {
                    a(t);
                }
            }
            function l(t) {
                var e;
                t.done
                    ? o(t.value)
                    : ((e = t.value),
                      e instanceof n
                          ? e
                          : new n(function (t) {
                                t(e);
                            })).then(s, r);
            }
            l((i = i.apply(t, e || [])).next());
        });
    }
    class i {
        constructor() {
            this.chars = "";
        }
        static parse(t) {
            const e = new i(),
                n = t.split(" ");
            e.size = n[0];
            const o = e.size.split("x");
            return (e.width = +o[0]), (e.height = +o[1]), (e.charLength = +n[1]), e;
        }
        get src() {
            return "data:image/jpeg;base64," + this.chars;
        }
        get isValid() {
            return this.chars.length == this.charLength && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(this.chars);
        }
    }
    class o {
        constructor(t, e, n, i) {
            (this.src = t), (this.gcode = e), (this.params = n), (this.comment = i);
        }
    }
    class a extends o {
        constructor(t, e, n, i) {
            super(t, e, n, i), (this.params = n);
        }
    }
    class s {
        constructor(t, e, n) {
            (this.layer = t), (this.commands = e), (this.lineNumber = n);
        }
    }
    class r {
        constructor() {
            (this.lines = []), (this.preamble = new s(-1, [], 0)), (this.layers = []), (this.curZ = 0), (this.maxZ = 0), (this.metadata = { thumbnails: {} });
        }
        parseGCode(t) {
            const e = Array.isArray(t) ? t : t.split("\n");
            this.lines = this.lines.concat(e);
            const n = this.lines2commands(e);
            this.groupIntoLayers(n);
            const i = this.parseMetadata(n.filter((t) => t.comment)).thumbnails;
            for (const [t, e] of Object.entries(i)) this.metadata.thumbnails[t] = e;
            return { layers: this.layers, metadata: this.metadata };
        }
        lines2commands(t) {
            return t.map((t) => this.parseCommand(t));
        }
        parseCommand(t, e = !0) {
            const n = t.trim().split(";"),
                i = n[0],
                s = (e && n[1]) || null,
                r = i.split(/ +/g),
                l = r[0].toLowerCase();
            let c;
            switch (l) {
                case "g0":
                case "g00":
                case "g1":
                case "g01":
                case "g2":
                case "g02":
                case "g3":
                case "g03":
                    return (c = this.parseMove(r.slice(1))), new a(t, l, c, s);
                default:
                    return (c = this.parseParams(r.slice(1))), new o(t, l, c, s);
            }
        }
        parseMove(t) {
            return t.reduce((t, e) => {
                const n = e.charAt(0).toLowerCase();
                return ("x" != n && "y" != n && "z" != n && "e" != n && "r" != n && "f" != n && "i" != n && "j" != n) || (t[n] = parseFloat(e.slice(1))), t;
            }, {});
        }
        isAlpha(t) {
            const e = t.charCodeAt(0);
            return (e >= 97 && e <= 122) || (e >= 65 && e <= 90);
        }
        parseParams(t) {
            return t.reduce((t, e) => {
                const n = e.charAt(0).toLowerCase();
                return this.isAlpha(n) && (t[n] = parseFloat(e.slice(1))), t;
            }, {});
        }
        groupIntoLayers(t) {
            for (let e = 0; e < t.length; e++) {
                const n = t[e];
                if (!(n instanceof a)) {
                    this.currentLayer ? this.currentLayer.commands.push(n) : this.preamble.commands.push(n);
                    continue;
                }
                const i = n.params;
                i.z && (this.curZ = i.z),
                    i.e > 0 && (null != i.x || null != i.y) && this.curZ > this.maxZ
                        ? ((this.maxZ = this.curZ), (this.currentLayer = new s(this.layers.length, [n], e)), this.layers.push(this.currentLayer))
                        : this.currentLayer
                        ? this.currentLayer.commands.push(n)
                        : this.preamble.commands.push(n);
            }
            return this.layers;
        }
        parseMetadata(t) {
            const e = {};
            let n = null;
            for (const o of t) {
                const t = o.comment,
                    a = t.indexOf("thumbnail begin"),
                    s = t.indexOf("thumbnail end");
                a > -1
                    ? (n = i.parse(t.slice(a + 15).trim()))
                    : n &&
                      (-1 == s
                          ? (n.chars += t.trim())
                          : (n.isValid ? ((e[n.size] = n), console.debug("thumb found", n.size), console.debug("declared length", n.charLength, "actual length", n.chars.length)) : console.warn("thumb found but seems to be invalid"),
                            (n = null)));
            }
            return { thumbnails: e };
        }
    }
    r.prototype.parseGcode = r.prototype.parseGCode;
    const l = { type: "change" },
        c = { type: "start" },
        d = { type: "end" };
    class u extends e.EventDispatcher {
        constructor(t, n) {
            super(),
                (this.object = t),
                (this.domElement = n),
                (this.domElement.style.touchAction = "none"),
                (this.enabled = !0),
                (this.target = new e.Vector3()),
                (this.minDistance = 0),
                (this.maxDistance = 1 / 0),
                (this.minZoom = 0),
                (this.maxZoom = 1 / 0),
                (this.minPolarAngle = 0),
                (this.maxPolarAngle = Math.PI),
                (this.minAzimuthAngle = -1 / 0),
                (this.maxAzimuthAngle = 1 / 0),
                (this.enableDamping = !1),
                (this.dampingFactor = 0.05),
                (this.enableZoom = !0),
                (this.zoomSpeed = 1),
                (this.enableRotate = !0),
                (this.rotateSpeed = 1),
                (this.enablePan = !0),
                (this.panSpeed = 1),
                (this.screenSpacePanning = !0),
                (this.keyPanSpeed = 7),
                (this.autoRotate = !1),
                (this.autoRotateSpeed = 2),
                (this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }),
                (this.mouseButtons = { LEFT: e.MOUSE.ROTATE, MIDDLE: e.MOUSE.DOLLY, RIGHT: e.MOUSE.PAN }),
                (this.touches = { ONE: e.TOUCH.ROTATE, TWO: e.TOUCH.DOLLY_PAN }),
                (this.target0 = this.target.clone()),
                (this.position0 = this.object.position.clone()),
                (this.zoom0 = this.object.zoom),
                (this._domElementKeyEvents = null),
                (this.getPolarAngle = function () {
                    return r.phi;
                }),
                (this.getAzimuthalAngle = function () {
                    return r.theta;
                }),
                (this.getDistance = function () {
                    return this.object.position.distanceTo(this.target);
                }),
                (this.listenToKeyEvents = function (t) {
                    t.addEventListener("keydown", Z), (this._domElementKeyEvents = t);
                }),
                (this.saveState = function () {
                    i.target0.copy(i.target), i.position0.copy(i.object.position), (i.zoom0 = i.object.zoom);
                }),
                (this.reset = function () {
                    i.target.copy(i.target0), i.object.position.copy(i.position0), (i.object.zoom = i.zoom0), i.object.updateProjectionMatrix(), i.dispatchEvent(l), i.update(), (a = o.NONE);
                }),
                (this.update = (function () {
                    const n = new e.Vector3(),
                        c = new e.Quaternion().setFromUnitVectors(t.up, new e.Vector3(0, 1, 0)),
                        d = c.clone().invert(),
                        f = new e.Vector3(),
                        g = new e.Quaternion(),
                        v = 2 * Math.PI;
                    return function () {
                        const t = i.object.position;
                        n.copy(t).sub(i.target),
                            n.applyQuaternion(c),
                            r.setFromVector3(n),
                            i.autoRotate && a === o.NONE && O(((2 * Math.PI) / 60 / 60) * i.autoRotateSpeed),
                            i.enableDamping ? ((r.theta += u.theta * i.dampingFactor), (r.phi += u.phi * i.dampingFactor)) : ((r.theta += u.theta), (r.phi += u.phi));
                        let e = i.minAzimuthAngle,
                            y = i.maxAzimuthAngle;
                        return (
                            isFinite(e) &&
                                isFinite(y) &&
                                (e < -Math.PI ? (e += v) : e > Math.PI && (e -= v),
                                y < -Math.PI ? (y += v) : y > Math.PI && (y -= v),
                                (r.theta = e <= y ? Math.max(e, Math.min(y, r.theta)) : r.theta > (e + y) / 2 ? Math.max(e, r.theta) : Math.min(y, r.theta))),
                            (r.phi = Math.max(i.minPolarAngle, Math.min(i.maxPolarAngle, r.phi))),
                            r.makeSafe(),
                            (r.radius *= h),
                            (r.radius = Math.max(i.minDistance, Math.min(i.maxDistance, r.radius))),
                            !0 === i.enableDamping ? i.target.addScaledVector(p, i.dampingFactor) : i.target.add(p),
                            n.setFromSpherical(r),
                            n.applyQuaternion(d),
                            t.copy(i.target).add(n),
                            i.object.lookAt(i.target),
                            !0 === i.enableDamping ? ((u.theta *= 1 - i.dampingFactor), (u.phi *= 1 - i.dampingFactor), p.multiplyScalar(1 - i.dampingFactor)) : (u.set(0, 0, 0), p.set(0, 0, 0)),
                            (h = 1),
                            !!(m || f.distanceToSquared(i.object.position) > s || 8 * (1 - g.dot(i.object.quaternion)) > s) && (i.dispatchEvent(l), f.copy(i.object.position), g.copy(i.object.quaternion), (m = !1), !0)
                        );
                    };
                })()),
                (this.dispose = function () {
                    i.domElement.removeEventListener("contextmenu", K),
                        i.domElement.removeEventListener("pointerdown", F),
                        i.domElement.removeEventListener("pointercancel", Y),
                        i.domElement.removeEventListener("wheel", W),
                        i.domElement.removeEventListener("pointermove", k),
                        i.domElement.removeEventListener("pointerup", G),
                        null !== i._domElementKeyEvents && i._domElementKeyEvents.removeEventListener("keydown", Z);
                });
            const i = this,
                o = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_PAN: 4, TOUCH_DOLLY_PAN: 5, TOUCH_DOLLY_ROTATE: 6 };
            let a = o.NONE;
            const s = 1e-6,
                r = new e.Spherical(),
                u = new e.Spherical();
            let h = 1;
            const p = new e.Vector3();
            let m = !1;
            const f = new e.Vector2(),
                g = new e.Vector2(),
                v = new e.Vector2(),
                y = new e.Vector2(),
                b = new e.Vector2(),
                w = new e.Vector2(),
                x = new e.Vector2(),
                S = new e.Vector2(),
                E = new e.Vector2(),
                L = [],
                A = {};
            function M() {
                return Math.pow(0.95, i.zoomSpeed);
            }
            function O(t) {
                u.theta -= t;
            }
            function z(t) {
                u.phi -= t;
            }
            const P = (function () {
                    const t = new e.Vector3();
                    return function (e, n) {
                        t.setFromMatrixColumn(n, 0), t.multiplyScalar(-e), p.add(t);
                    };
                })(),
                T = (function () {
                    const t = new e.Vector3();
                    return function (e, n) {
                        !0 === i.screenSpacePanning ? t.setFromMatrixColumn(n, 1) : (t.setFromMatrixColumn(n, 0), t.crossVectors(i.object.up, t)), t.multiplyScalar(e), p.add(t);
                    };
                })(),
                _ = (function () {
                    const t = new e.Vector3();
                    return function (e, n) {
                        const o = i.domElement;
                        if (i.object.isPerspectiveCamera) {
                            const a = i.object.position;
                            t.copy(a).sub(i.target);
                            let s = t.length();
                            (s *= Math.tan(((i.object.fov / 2) * Math.PI) / 180)), P((2 * e * s) / o.clientHeight, i.object.matrix), T((2 * n * s) / o.clientHeight, i.object.matrix);
                        } else
                            i.object.isOrthographicCamera
                                ? (P((e * (i.object.right - i.object.left)) / i.object.zoom / o.clientWidth, i.object.matrix), T((n * (i.object.top - i.object.bottom)) / i.object.zoom / o.clientHeight, i.object.matrix))
                                : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), (i.enablePan = !1));
                    };
                })();
            function C(t) {
                i.object.isPerspectiveCamera
                    ? (h /= t)
                    : i.object.isOrthographicCamera
                    ? ((i.object.zoom = Math.max(i.minZoom, Math.min(i.maxZoom, i.object.zoom * t))), i.object.updateProjectionMatrix(), (m = !0))
                    : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), (i.enableZoom = !1));
            }
            function U(t) {
                i.object.isPerspectiveCamera
                    ? (h *= t)
                    : i.object.isOrthographicCamera
                    ? ((i.object.zoom = Math.max(i.minZoom, Math.min(i.maxZoom, i.object.zoom / t))), i.object.updateProjectionMatrix(), (m = !0))
                    : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), (i.enableZoom = !1));
            }
            function D(t) {
                f.set(t.clientX, t.clientY);
            }
            function I(t) {
                y.set(t.clientX, t.clientY);
            }
            function B() {
                if (1 === L.length) f.set(L[0].pageX, L[0].pageY);
                else {
                    const t = 0.5 * (L[0].pageX + L[1].pageX),
                        e = 0.5 * (L[0].pageY + L[1].pageY);
                    f.set(t, e);
                }
            }
            function j() {
                if (1 === L.length) y.set(L[0].pageX, L[0].pageY);
                else {
                    const t = 0.5 * (L[0].pageX + L[1].pageX),
                        e = 0.5 * (L[0].pageY + L[1].pageY);
                    y.set(t, e);
                }
            }
            function N() {
                const t = L[0].pageX - L[1].pageX,
                    e = L[0].pageY - L[1].pageY,
                    n = Math.sqrt(t * t + e * e);
                x.set(0, n);
            }
            function V(t) {
                if (1 == L.length) g.set(t.pageX, t.pageY);
                else {
                    const e = Q(t),
                        n = 0.5 * (t.pageX + e.x),
                        i = 0.5 * (t.pageY + e.y);
                    g.set(n, i);
                }
                v.subVectors(g, f).multiplyScalar(i.rotateSpeed);
                const e = i.domElement;
                O((2 * Math.PI * v.x) / e.clientHeight), z((2 * Math.PI * v.y) / e.clientHeight), f.copy(g);
            }
            function R(t) {
                if (1 === L.length) b.set(t.pageX, t.pageY);
                else {
                    const e = Q(t),
                        n = 0.5 * (t.pageX + e.x),
                        i = 0.5 * (t.pageY + e.y);
                    b.set(n, i);
                }
                w.subVectors(b, y).multiplyScalar(i.panSpeed), _(w.x, w.y), y.copy(b);
            }
            function H(t) {
                const e = Q(t),
                    n = t.pageX - e.x,
                    o = t.pageY - e.y,
                    a = Math.sqrt(n * n + o * o);
                S.set(0, a), E.set(0, Math.pow(S.y / x.y, i.zoomSpeed)), C(E.y), x.copy(S);
            }
            function F(t) {
                !1 !== i.enabled &&
                    (0 === L.length && (i.domElement.setPointerCapture(t.pointerId), i.domElement.addEventListener("pointermove", k), i.domElement.addEventListener("pointerup", G)),
                    (function (t) {
                        L.push(t);
                    })(t),
                    "touch" === t.pointerType
                        ? (function (t) {
                              switch ((q(t), L.length)) {
                                  case 1:
                                      switch (i.touches.ONE) {
                                          case e.TOUCH.ROTATE:
                                              if (!1 === i.enableRotate) return;
                                              B(), (a = o.TOUCH_ROTATE);
                                              break;
                                          case e.TOUCH.PAN:
                                              if (!1 === i.enablePan) return;
                                              j(), (a = o.TOUCH_PAN);
                                              break;
                                          default:
                                              a = o.NONE;
                                      }
                                      break;
                                  case 2:
                                      switch (i.touches.TWO) {
                                          case e.TOUCH.DOLLY_PAN:
                                              if (!1 === i.enableZoom && !1 === i.enablePan) return;
                                              i.enableZoom && N(), i.enablePan && j(), (a = o.TOUCH_DOLLY_PAN);
                                              break;
                                          case e.TOUCH.DOLLY_ROTATE:
                                              if (!1 === i.enableZoom && !1 === i.enableRotate) return;
                                              i.enableZoom && N(), i.enableRotate && B(), (a = o.TOUCH_DOLLY_ROTATE);
                                              break;
                                          default:
                                              a = o.NONE;
                                      }
                                      break;
                                  default:
                                      a = o.NONE;
                              }
                              a !== o.NONE && i.dispatchEvent(c);
                          })(t)
                        : (function (t) {
                              let n;
                              switch (t.button) {
                                  case 0:
                                      n = i.mouseButtons.LEFT;
                                      break;
                                  case 1:
                                      n = i.mouseButtons.MIDDLE;
                                      break;
                                  case 2:
                                      n = i.mouseButtons.RIGHT;
                                      break;
                                  default:
                                      n = -1;
                              }
                              switch (n) {
                                  case e.MOUSE.DOLLY:
                                      if (!1 === i.enableZoom) return;
                                      !(function (t) {
                                          x.set(t.clientX, t.clientY);
                                      })(t),
                                          (a = o.DOLLY);
                                      break;
                                  case e.MOUSE.ROTATE:
                                      if (t.ctrlKey || t.metaKey || t.shiftKey) {
                                          if (!1 === i.enablePan) return;
                                          I(t), (a = o.PAN);
                                      } else {
                                          if (!1 === i.enableRotate) return;
                                          D(t), (a = o.ROTATE);
                                      }
                                      break;
                                  case e.MOUSE.PAN:
                                      if (t.ctrlKey || t.metaKey || t.shiftKey) {
                                          if (!1 === i.enableRotate) return;
                                          D(t), (a = o.ROTATE);
                                      } else {
                                          if (!1 === i.enablePan) return;
                                          I(t), (a = o.PAN);
                                      }
                                      break;
                                  default:
                                      a = o.NONE;
                              }
                              a !== o.NONE && i.dispatchEvent(c);
                          })(t));
            }
            function k(t) {
                !1 !== i.enabled &&
                    ("touch" === t.pointerType
                        ? (function (t) {
                              switch ((q(t), a)) {
                                  case o.TOUCH_ROTATE:
                                      if (!1 === i.enableRotate) return;
                                      V(t), i.update();
                                      break;
                                  case o.TOUCH_PAN:
                                      if (!1 === i.enablePan) return;
                                      R(t), i.update();
                                      break;
                                  case o.TOUCH_DOLLY_PAN:
                                      if (!1 === i.enableZoom && !1 === i.enablePan) return;
                                      !(function (t) {
                                          i.enableZoom && H(t), i.enablePan && R(t);
                                      })(t),
                                          i.update();
                                      break;
                                  case o.TOUCH_DOLLY_ROTATE:
                                      if (!1 === i.enableZoom && !1 === i.enableRotate) return;
                                      !(function (t) {
                                          i.enableZoom && H(t), i.enableRotate && V(t);
                                      })(t),
                                          i.update();
                                      break;
                                  default:
                                      a = o.NONE;
                              }
                          })(t)
                        : (function (t) {
                              switch (a) {
                                  case o.ROTATE:
                                      if (!1 === i.enableRotate) return;
                                      !(function (t) {
                                          g.set(t.clientX, t.clientY), v.subVectors(g, f).multiplyScalar(i.rotateSpeed);
                                          const e = i.domElement;
                                          O((2 * Math.PI * v.x) / e.clientHeight), z((2 * Math.PI * v.y) / e.clientHeight), f.copy(g), i.update();
                                      })(t);
                                      break;
                                  case o.DOLLY:
                                      if (!1 === i.enableZoom) return;
                                      !(function (t) {
                                          S.set(t.clientX, t.clientY), E.subVectors(S, x), E.y > 0 ? C(M()) : E.y < 0 && U(M()), x.copy(S), i.update();
                                      })(t);
                                      break;
                                  case o.PAN:
                                      if (!1 === i.enablePan) return;
                                      !(function (t) {
                                          b.set(t.clientX, t.clientY), w.subVectors(b, y).multiplyScalar(i.panSpeed), _(w.x, w.y), y.copy(b), i.update();
                                      })(t);
                              }
                          })(t));
            }
            function G(t) {
                X(t), 0 === L.length && (i.domElement.releasePointerCapture(t.pointerId), i.domElement.removeEventListener("pointermove", k), i.domElement.removeEventListener("pointerup", G)), i.dispatchEvent(d), (a = o.NONE);
            }
            function Y(t) {
                X(t);
            }
            function W(t) {
                !1 !== i.enabled &&
                    !1 !== i.enableZoom &&
                    a === o.NONE &&
                    (t.preventDefault(),
                    i.dispatchEvent(c),
                    (function (t) {
                        t.deltaY < 0 ? U(M()) : t.deltaY > 0 && C(M()), i.update();
                    })(t),
                    i.dispatchEvent(d));
            }
            function Z(t) {
                !1 !== i.enabled &&
                    !1 !== i.enablePan &&
                    (function (t) {
                        let e = !1;
                        switch (t.code) {
                            case i.keys.UP:
                                t.ctrlKey || t.metaKey || t.shiftKey ? z((2 * Math.PI * i.rotateSpeed) / i.domElement.clientHeight) : _(0, i.keyPanSpeed), (e = !0);
                                break;
                            case i.keys.BOTTOM:
                                t.ctrlKey || t.metaKey || t.shiftKey ? z((-2 * Math.PI * i.rotateSpeed) / i.domElement.clientHeight) : _(0, -i.keyPanSpeed), (e = !0);
                                break;
                            case i.keys.LEFT:
                                t.ctrlKey || t.metaKey || t.shiftKey ? O((2 * Math.PI * i.rotateSpeed) / i.domElement.clientHeight) : _(i.keyPanSpeed, 0), (e = !0);
                                break;
                            case i.keys.RIGHT:
                                t.ctrlKey || t.metaKey || t.shiftKey ? O((-2 * Math.PI * i.rotateSpeed) / i.domElement.clientHeight) : _(-i.keyPanSpeed, 0), (e = !0);
                        }
                        e && (t.preventDefault(), i.update());
                    })(t);
            }
            function K(t) {
                !1 !== i.enabled && t.preventDefault();
            }
            function X(t) {
                delete A[t.pointerId];
                for (let e = 0; e < L.length; e++) if (L[e].pointerId == t.pointerId) return void L.splice(e, 1);
            }
            function q(t) {
                let n = A[t.pointerId];
                void 0 === n && ((n = new e.Vector2()), (A[t.pointerId] = n)), n.set(t.pageX, t.pageY);
            }
            function Q(t) {
                const e = t.pointerId === L[0].pointerId ? L[1] : L[0];
                return A[e.pointerId];
            }
            i.domElement.addEventListener("contextmenu", K), i.domElement.addEventListener("pointerdown", F), i.domElement.addEventListener("pointercancel", Y), i.domElement.addEventListener("wheel", W, { passive: !1 }), this.update();
        }
    }
    (e.UniformsLib.line = { worldUnits: { value: 1 }, linewidth: { value: 1 }, resolution: { value: new e.Vector2(1, 1) }, dashOffset: { value: 0 }, dashScale: { value: 1 }, dashSize: { value: 1 }, gapSize: { value: 1 } }),
        (e.ShaderLib.line = {
            uniforms: e.UniformsUtils.merge([e.UniformsLib.common, e.UniformsLib.fog, e.UniformsLib.line]),
            vertexShader:
                "\n\t\t#include <common>\n\t\t#include <color_pars_vertex>\n\t\t#include <fog_pars_vertex>\n\t\t#include <logdepthbuf_pars_vertex>\n\t\t#include <clipping_planes_pars_vertex>\n\n\t\tuniform float linewidth;\n\t\tuniform vec2 resolution;\n\n\t\tattribute vec3 instanceStart;\n\t\tattribute vec3 instanceEnd;\n\n\t\tattribute vec3 instanceColorStart;\n\t\tattribute vec3 instanceColorEnd;\n\n\t\t#ifdef WORLD_UNITS\n\n\t\t\tvarying vec4 worldPos;\n\t\t\tvarying vec3 worldStart;\n\t\t\tvarying vec3 worldEnd;\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tvarying vec2 vUv;\n\n\t\t\t#endif\n\n\t\t#else\n\n\t\t\tvarying vec2 vUv;\n\n\t\t#endif\n\n\t\t#ifdef USE_DASH\n\n\t\t\tuniform float dashScale;\n\t\t\tattribute float instanceDistanceStart;\n\t\t\tattribute float instanceDistanceEnd;\n\t\t\tvarying float vLineDistance;\n\n\t\t#endif\n\n\t\tvoid trimSegment( const in vec4 start, inout vec4 end ) {\n\n\t\t\t// trim end segment so it terminates between the camera plane and the near plane\n\n\t\t\t// conservative estimate of the near plane\n\t\t\tfloat a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column\n\t\t\tfloat b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column\n\t\t\tfloat nearEstimate = - 0.5 * b / a;\n\n\t\t\tfloat alpha = ( nearEstimate - start.z ) / ( end.z - start.z );\n\n\t\t\tend.xyz = mix( start.xyz, end.xyz, alpha );\n\n\t\t}\n\n\t\tvoid main() {\n\n\t\t\t#ifdef USE_COLOR\n\n\t\t\t\tvColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;\n\n\t\t\t#endif\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tvLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;\n\t\t\t\tvUv = uv;\n\n\t\t\t#endif\n\n\t\t\tfloat aspect = resolution.x / resolution.y;\n\n\t\t\t// camera space\n\t\t\tvec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );\n\t\t\tvec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );\n\n\t\t\t#ifdef WORLD_UNITS\n\n\t\t\t\tworldStart = start.xyz;\n\t\t\t\tworldEnd = end.xyz;\n\n\t\t\t#else\n\n\t\t\t\tvUv = uv;\n\n\t\t\t#endif\n\n\t\t\t// special case for perspective projection, and segments that terminate either in, or behind, the camera plane\n\t\t\t// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space\n\t\t\t// but we need to perform ndc-space calculations in the shader, so we must address this issue directly\n\t\t\t// perhaps there is a more elegant solution -- WestLangley\n\n\t\t\tbool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column\n\n\t\t\tif ( perspective ) {\n\n\t\t\t\tif ( start.z < 0.0 && end.z >= 0.0 ) {\n\n\t\t\t\t\ttrimSegment( start, end );\n\n\t\t\t\t} else if ( end.z < 0.0 && start.z >= 0.0 ) {\n\n\t\t\t\t\ttrimSegment( end, start );\n\n\t\t\t\t}\n\n\t\t\t}\n\n\t\t\t// clip space\n\t\t\tvec4 clipStart = projectionMatrix * start;\n\t\t\tvec4 clipEnd = projectionMatrix * end;\n\n\t\t\t// ndc space\n\t\t\tvec3 ndcStart = clipStart.xyz / clipStart.w;\n\t\t\tvec3 ndcEnd = clipEnd.xyz / clipEnd.w;\n\n\t\t\t// direction\n\t\t\tvec2 dir = ndcEnd.xy - ndcStart.xy;\n\n\t\t\t// account for clip-space aspect ratio\n\t\t\tdir.x *= aspect;\n\t\t\tdir = normalize( dir );\n\n\t\t\t#ifdef WORLD_UNITS\n\n\t\t\t\t// get the offset direction as perpendicular to the view vector\n\t\t\t\tvec3 worldDir = normalize( end.xyz - start.xyz );\n\t\t\t\tvec3 offset;\n\t\t\t\tif ( position.y < 0.5 ) {\n\n\t\t\t\t\toffset = normalize( cross( start.xyz, worldDir ) );\n\n\t\t\t\t} else {\n\n\t\t\t\t\toffset = normalize( cross( end.xyz, worldDir ) );\n\n\t\t\t\t}\n\n\t\t\t\t// sign flip\n\t\t\t\tif ( position.x < 0.0 ) offset *= - 1.0;\n\n\t\t\t\tfloat forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );\n\n\t\t\t\t// don't extend the line if we're rendering dashes because we\n\t\t\t\t// won't be rendering the endcaps\n\t\t\t\t#ifndef USE_DASH\n\n\t\t\t\t\t// extend the line bounds to encompass  endcaps\n\t\t\t\t\tstart.xyz += - worldDir * linewidth * 0.5;\n\t\t\t\t\tend.xyz += worldDir * linewidth * 0.5;\n\n\t\t\t\t\t// shift the position of the quad so it hugs the forward edge of the line\n\t\t\t\t\toffset.xy -= dir * forwardOffset;\n\t\t\t\t\toffset.z += 0.5;\n\n\t\t\t\t#endif\n\n\t\t\t\t// endcaps\n\t\t\t\tif ( position.y > 1.0 || position.y < 0.0 ) {\n\n\t\t\t\t\toffset.xy += dir * 2.0 * forwardOffset;\n\n\t\t\t\t}\n\n\t\t\t\t// adjust for linewidth\n\t\t\t\toffset *= linewidth * 0.5;\n\n\t\t\t\t// set the world position\n\t\t\t\tworldPos = ( position.y < 0.5 ) ? start : end;\n\t\t\t\tworldPos.xyz += offset;\n\n\t\t\t\t// project the worldpos\n\t\t\t\tvec4 clip = projectionMatrix * worldPos;\n\n\t\t\t\t// shift the depth of the projected points so the line\n\t\t\t\t// segments overlap neatly\n\t\t\t\tvec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;\n\t\t\t\tclip.z = clipPose.z * clip.w;\n\n\t\t\t#else\n\n\t\t\t\tvec2 offset = vec2( dir.y, - dir.x );\n\t\t\t\t// undo aspect ratio adjustment\n\t\t\t\tdir.x /= aspect;\n\t\t\t\toffset.x /= aspect;\n\n\t\t\t\t// sign flip\n\t\t\t\tif ( position.x < 0.0 ) offset *= - 1.0;\n\n\t\t\t\t// endcaps\n\t\t\t\tif ( position.y < 0.0 ) {\n\n\t\t\t\t\toffset += - dir;\n\n\t\t\t\t} else if ( position.y > 1.0 ) {\n\n\t\t\t\t\toffset += dir;\n\n\t\t\t\t}\n\n\t\t\t\t// adjust for linewidth\n\t\t\t\toffset *= linewidth;\n\n\t\t\t\t// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...\n\t\t\t\toffset /= resolution.y;\n\n\t\t\t\t// select end\n\t\t\t\tvec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;\n\n\t\t\t\t// back to clip space\n\t\t\t\toffset *= clip.w;\n\n\t\t\t\tclip.xy += offset;\n\n\t\t\t#endif\n\n\t\t\tgl_Position = clip;\n\n\t\t\tvec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation\n\n\t\t\t#include <logdepthbuf_vertex>\n\t\t\t#include <clipping_planes_vertex>\n\t\t\t#include <fog_vertex>\n\n\t\t}\n\t\t",
            fragmentShader:
                "\n\t\tuniform vec3 diffuse;\n\t\tuniform float opacity;\n\t\tuniform float linewidth;\n\n\t\t#ifdef USE_DASH\n\n\t\t\tuniform float dashOffset;\n\t\t\tuniform float dashSize;\n\t\t\tuniform float gapSize;\n\n\t\t#endif\n\n\t\tvarying float vLineDistance;\n\n\t\t#ifdef WORLD_UNITS\n\n\t\t\tvarying vec4 worldPos;\n\t\t\tvarying vec3 worldStart;\n\t\t\tvarying vec3 worldEnd;\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tvarying vec2 vUv;\n\n\t\t\t#endif\n\n\t\t#else\n\n\t\t\tvarying vec2 vUv;\n\n\t\t#endif\n\n\t\t#include <common>\n\t\t#include <color_pars_fragment>\n\t\t#include <fog_pars_fragment>\n\t\t#include <logdepthbuf_pars_fragment>\n\t\t#include <clipping_planes_pars_fragment>\n\n\t\tvec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {\n\n\t\t\tfloat mua;\n\t\t\tfloat mub;\n\n\t\t\tvec3 p13 = p1 - p3;\n\t\t\tvec3 p43 = p4 - p3;\n\n\t\t\tvec3 p21 = p2 - p1;\n\n\t\t\tfloat d1343 = dot( p13, p43 );\n\t\t\tfloat d4321 = dot( p43, p21 );\n\t\t\tfloat d1321 = dot( p13, p21 );\n\t\t\tfloat d4343 = dot( p43, p43 );\n\t\t\tfloat d2121 = dot( p21, p21 );\n\n\t\t\tfloat denom = d2121 * d4343 - d4321 * d4321;\n\n\t\t\tfloat numer = d1343 * d4321 - d1321 * d4343;\n\n\t\t\tmua = numer / denom;\n\t\t\tmua = clamp( mua, 0.0, 1.0 );\n\t\t\tmub = ( d1343 + d4321 * ( mua ) ) / d4343;\n\t\t\tmub = clamp( mub, 0.0, 1.0 );\n\n\t\t\treturn vec2( mua, mub );\n\n\t\t}\n\n\t\tvoid main() {\n\n\t\t\t#include <clipping_planes_fragment>\n\n\t\t\t#ifdef USE_DASH\n\n\t\t\t\tif ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps\n\n\t\t\t\tif ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX\n\n\t\t\t#endif\n\n\t\t\tfloat alpha = opacity;\n\n\t\t\t#ifdef WORLD_UNITS\n\n\t\t\t\t// Find the closest points on the view ray and the line segment\n\t\t\t\tvec3 rayEnd = normalize( worldPos.xyz ) * 1e5;\n\t\t\t\tvec3 lineDir = worldEnd - worldStart;\n\t\t\t\tvec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );\n\n\t\t\t\tvec3 p1 = worldStart + lineDir * params.x;\n\t\t\t\tvec3 p2 = rayEnd * params.y;\n\t\t\t\tvec3 delta = p1 - p2;\n\t\t\t\tfloat len = length( delta );\n\t\t\t\tfloat norm = len / linewidth;\n\n\t\t\t\t#ifndef USE_DASH\n\n\t\t\t\t\t#ifdef USE_ALPHA_TO_COVERAGE\n\n\t\t\t\t\t\tfloat dnorm = fwidth( norm );\n\t\t\t\t\t\talpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );\n\n\t\t\t\t\t#else\n\n\t\t\t\t\t\tif ( norm > 0.5 ) {\n\n\t\t\t\t\t\t\tdiscard;\n\n\t\t\t\t\t\t}\n\n\t\t\t\t\t#endif\n\n\t\t\t\t#endif\n\n\t\t\t#else\n\n\t\t\t\t#ifdef USE_ALPHA_TO_COVERAGE\n\n\t\t\t\t\t// artifacts appear on some hardware if a derivative is taken within a conditional\n\t\t\t\t\tfloat a = vUv.x;\n\t\t\t\t\tfloat b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;\n\t\t\t\t\tfloat len2 = a * a + b * b;\n\t\t\t\t\tfloat dlen = fwidth( len2 );\n\n\t\t\t\t\tif ( abs( vUv.y ) > 1.0 ) {\n\n\t\t\t\t\t\talpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );\n\n\t\t\t\t\t}\n\n\t\t\t\t#else\n\n\t\t\t\t\tif ( abs( vUv.y ) > 1.0 ) {\n\n\t\t\t\t\t\tfloat a = vUv.x;\n\t\t\t\t\t\tfloat b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;\n\t\t\t\t\t\tfloat len2 = a * a + b * b;\n\n\t\t\t\t\t\tif ( len2 > 1.0 ) discard;\n\n\t\t\t\t\t}\n\n\t\t\t\t#endif\n\n\t\t\t#endif\n\n\t\t\tvec4 diffuseColor = vec4( diffuse, alpha );\n\n\t\t\t#include <logdepthbuf_fragment>\n\t\t\t#include <color_fragment>\n\n\t\t\tgl_FragColor = vec4( diffuseColor.rgb, alpha );\n\n\t\t\t#include <tonemapping_fragment>\n\t\t\t#include <encodings_fragment>\n\t\t\t#include <fog_fragment>\n\t\t\t#include <premultiplied_alpha_fragment>\n\n\t\t}\n\t\t",
        });
    class h extends e.ShaderMaterial {
        constructor(t) {
            super({ type: "LineMaterial", uniforms: e.UniformsUtils.clone(e.ShaderLib.line.uniforms), vertexShader: e.ShaderLib.line.vertexShader, fragmentShader: e.ShaderLib.line.fragmentShader, clipping: !0 }),
                (this.isLineMaterial = !0),
                Object.defineProperties(this, {
                    color: {
                        enumerable: !0,
                        get: function () {
                            return this.uniforms.diffuse.value;
                        },
                        set: function (t) {
                            this.uniforms.diffuse.value = t;
                        },
                    },
                    worldUnits: {
                        enumerable: !0,
                        get: function () {
                            return "WORLD_UNITS" in this.defines;
                        },
                        set: function (t) {
                            !0 === t ? (this.defines.WORLD_UNITS = "") : delete this.defines.WORLD_UNITS;
                        },
                    },
                    linewidth: {
                        enumerable: !0,
                        get: function () {
                            return this.uniforms.linewidth.value;
                        },
                        set: function (t) {
                            this.uniforms.linewidth.value = t;
                        },
                    },
                    dashed: {
                        enumerable: !0,
                        get: function () {
                            return Boolean("USE_DASH" in this.defines);
                        },
                        set(t) {
                            Boolean(t) !== Boolean("USE_DASH" in this.defines) && (this.needsUpdate = !0), !0 === t ? (this.defines.USE_DASH = "") : delete this.defines.USE_DASH;
                        },
                    },
                    dashScale: {
                        enumerable: !0,
                        get: function () {
                            return this.uniforms.dashScale.value;
                        },
                        set: function (t) {
                            this.uniforms.dashScale.value = t;
                        },
                    },
                    dashSize: {
                        enumerable: !0,
                        get: function () {
                            return this.uniforms.dashSize.value;
                        },
                        set: function (t) {
                            this.uniforms.dashSize.value = t;
                        },
                    },
                    dashOffset: {
                        enumerable: !0,
                        get: function () {
                            return this.uniforms.dashOffset.value;
                        },
                        set: function (t) {
                            this.uniforms.dashOffset.value = t;
                        },
                    },
                    gapSize: {
                        enumerable: !0,
                        get: function () {
                            return this.uniforms.gapSize.value;
                        },
                        set: function (t) {
                            this.uniforms.gapSize.value = t;
                        },
                    },
                    opacity: {
                        enumerable: !0,
                        get: function () {
                            return this.uniforms.opacity.value;
                        },
                        set: function (t) {
                            this.uniforms.opacity.value = t;
                        },
                    },
                    resolution: {
                        enumerable: !0,
                        get: function () {
                            return this.uniforms.resolution.value;
                        },
                        set: function (t) {
                            this.uniforms.resolution.value.copy(t);
                        },
                    },
                    alphaToCoverage: {
                        enumerable: !0,
                        get: function () {
                            return Boolean("USE_ALPHA_TO_COVERAGE" in this.defines);
                        },
                        set: function (t) {
                            Boolean(t) !== Boolean("USE_ALPHA_TO_COVERAGE" in this.defines) && (this.needsUpdate = !0),
                                !0 === t ? ((this.defines.USE_ALPHA_TO_COVERAGE = ""), (this.extensions.derivatives = !0)) : (delete this.defines.USE_ALPHA_TO_COVERAGE, (this.extensions.derivatives = !1));
                        },
                    },
                }),
                this.setValues(t);
        }
    }
    const p = new e.Box3(),
        m = new e.Vector3();
    class f extends e.InstancedBufferGeometry {
        constructor() {
            super(), (this.isLineSegmentsGeometry = !0), (this.type = "LineSegmentsGeometry");
            this.setIndex([0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5]),
                this.setAttribute("position", new e.Float32BufferAttribute([-1, 2, 0, 1, 2, 0, -1, 1, 0, 1, 1, 0, -1, 0, 0, 1, 0, 0, -1, -1, 0, 1, -1, 0], 3)),
                this.setAttribute("uv", new e.Float32BufferAttribute([-1, 2, 1, 2, -1, 1, 1, 1, -1, -1, 1, -1, -1, -2, 1, -2], 2));
        }
        applyMatrix4(t) {
            const e = this.attributes.instanceStart,
                n = this.attributes.instanceEnd;
            return void 0 !== e && (e.applyMatrix4(t), n.applyMatrix4(t), (e.needsUpdate = !0)), null !== this.boundingBox && this.computeBoundingBox(), null !== this.boundingSphere && this.computeBoundingSphere(), this;
        }
        setPositions(t) {
            let n;
            t instanceof Float32Array ? (n = t) : Array.isArray(t) && (n = new Float32Array(t));
            const i = new e.InstancedInterleavedBuffer(n, 6, 1);
            return this.setAttribute("instanceStart", new e.InterleavedBufferAttribute(i, 3, 0)), this.setAttribute("instanceEnd", new e.InterleavedBufferAttribute(i, 3, 3)), this.computeBoundingBox(), this.computeBoundingSphere(), this;
        }
        setColors(t) {
            let n;
            t instanceof Float32Array ? (n = t) : Array.isArray(t) && (n = new Float32Array(t));
            const i = new e.InstancedInterleavedBuffer(n, 6, 1);
            return this.setAttribute("instanceColorStart", new e.InterleavedBufferAttribute(i, 3, 0)), this.setAttribute("instanceColorEnd", new e.InterleavedBufferAttribute(i, 3, 3)), this;
        }
        fromWireframeGeometry(t) {
            return this.setPositions(t.attributes.position.array), this;
        }
        fromEdgesGeometry(t) {
            return this.setPositions(t.attributes.position.array), this;
        }
        fromMesh(t) {
            return this.fromWireframeGeometry(new e.WireframeGeometry(t.geometry)), this;
        }
        fromLineSegments(t) {
            const e = t.geometry;
            return this.setPositions(e.attributes.position.array), this;
        }
        computeBoundingBox() {
            null === this.boundingBox && (this.boundingBox = new e.Box3());
            const t = this.attributes.instanceStart,
                n = this.attributes.instanceEnd;
            void 0 !== t && void 0 !== n && (this.boundingBox.setFromBufferAttribute(t), p.setFromBufferAttribute(n), this.boundingBox.union(p));
        }
        computeBoundingSphere() {
            null === this.boundingSphere && (this.boundingSphere = new e.Sphere()), null === this.boundingBox && this.computeBoundingBox();
            const t = this.attributes.instanceStart,
                n = this.attributes.instanceEnd;
            if (void 0 !== t && void 0 !== n) {
                const e = this.boundingSphere.center;
                this.boundingBox.getCenter(e);
                let i = 0;
                for (let o = 0, a = t.count; o < a; o++) m.fromBufferAttribute(t, o), (i = Math.max(i, e.distanceToSquared(m))), m.fromBufferAttribute(n, o), (i = Math.max(i, e.distanceToSquared(m)));
                (this.boundingSphere.radius = Math.sqrt(i)),
                    isNaN(this.boundingSphere.radius) && console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.", this);
            }
        }
        toJSON() {}
        applyMatrix(t) {
            return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."), this.applyMatrix4(t);
        }
    }
    class g extends f {
        constructor() {
            super(), (this.isLineGeometry = !0), (this.type = "LineGeometry");
        }
        setPositions(t) {
            const e = t.length - 3,
                n = new Float32Array(2 * e);
            for (let i = 0; i < e; i += 3) (n[2 * i] = t[i]), (n[2 * i + 1] = t[i + 1]), (n[2 * i + 2] = t[i + 2]), (n[2 * i + 3] = t[i + 3]), (n[2 * i + 4] = t[i + 4]), (n[2 * i + 5] = t[i + 5]);
            return super.setPositions(n), this;
        }
        setColors(t) {
            const e = t.length - 3,
                n = new Float32Array(2 * e);
            for (let i = 0; i < e; i += 3) (n[2 * i] = t[i]), (n[2 * i + 1] = t[i + 1]), (n[2 * i + 2] = t[i + 2]), (n[2 * i + 3] = t[i + 3]), (n[2 * i + 4] = t[i + 4]), (n[2 * i + 5] = t[i + 5]);
            return super.setColors(n), this;
        }
        fromLine(t) {
            const e = t.geometry;
            return this.setPositions(e.attributes.position.array), this;
        }
    }
    const v = new e.Vector3(),
        y = new e.Vector3(),
        b = new e.Vector4(),
        w = new e.Vector4(),
        x = new e.Vector4(),
        S = new e.Vector3(),
        E = new e.Matrix4(),
        L = new e.Line3(),
        A = new e.Vector3(),
        M = new e.Box3(),
        O = new e.Sphere(),
        z = new e.Vector4();
    let P, T;
    function _(t, e, n) {
        return z.set(0, 0, -e, 1).applyMatrix4(t.projectionMatrix), z.multiplyScalar(1 / z.w), (z.x = T / n.width), (z.y = T / n.height), z.applyMatrix4(t.projectionMatrixInverse), z.multiplyScalar(1 / z.w), Math.abs(Math.max(z.x, z.y));
    }
    class C extends e.Mesh {
        constructor(t = new f(), e = new h({ color: 16777215 * Math.random() })) {
            super(t, e), (this.isLineSegments2 = !0), (this.type = "LineSegments2");
        }
        computeLineDistances() {
            const t = this.geometry,
                n = t.attributes.instanceStart,
                i = t.attributes.instanceEnd,
                o = new Float32Array(2 * n.count);
            for (let t = 0, e = 0, a = n.count; t < a; t++, e += 2) v.fromBufferAttribute(n, t), y.fromBufferAttribute(i, t), (o[e] = 0 === e ? 0 : o[e - 1]), (o[e + 1] = o[e] + v.distanceTo(y));
            const a = new e.InstancedInterleavedBuffer(o, 2, 1);
            return t.setAttribute("instanceDistanceStart", new e.InterleavedBufferAttribute(a, 1, 0)), t.setAttribute("instanceDistanceEnd", new e.InterleavedBufferAttribute(a, 1, 1)), this;
        }
        raycast(t, n) {
            const i = this.material.worldUnits,
                o = t.camera;
            null !== o || i || console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');
            const a = (void 0 !== t.params.Line2 && t.params.Line2.threshold) || 0;
            P = t.ray;
            const s = this.matrixWorld,
                r = this.geometry,
                l = this.material;
            let c, d;
            if (((T = l.linewidth + a), null === r.boundingSphere && r.computeBoundingSphere(), O.copy(r.boundingSphere).applyMatrix4(s), i)) c = 0.5 * T;
            else {
                c = _(o, Math.max(o.near, O.distanceToPoint(P.origin)), l.resolution);
            }
            if (((O.radius += c), !1 !== P.intersectsSphere(O))) {
                if ((null === r.boundingBox && r.computeBoundingBox(), M.copy(r.boundingBox).applyMatrix4(s), i)) d = 0.5 * T;
                else {
                    d = _(o, Math.max(o.near, M.distanceToPoint(P.origin)), l.resolution);
                }
                M.expandByScalar(d),
                    !1 !== P.intersectsBox(M) &&
                        (i
                            ? (function (t, n) {
                                  const i = t.matrixWorld,
                                      o = t.geometry,
                                      a = o.attributes.instanceStart,
                                      s = o.attributes.instanceEnd;
                                  for (let r = 0, l = Math.min(o.instanceCount, a.count); r < l; r++) {
                                      L.start.fromBufferAttribute(a, r), L.end.fromBufferAttribute(s, r), L.applyMatrix4(i);
                                      const o = new e.Vector3(),
                                          l = new e.Vector3();
                                      P.distanceSqToSegment(L.start, L.end, l, o),
                                          l.distanceTo(o) < 0.5 * T && n.push({ point: l, pointOnLine: o, distance: P.origin.distanceTo(l), object: t, face: null, faceIndex: r, uv: null, uv2: null });
                                  }
                              })(this, n)
                            : (function (t, n, i) {
                                  const o = n.projectionMatrix,
                                      a = t.material.resolution,
                                      s = t.matrixWorld,
                                      r = t.geometry,
                                      l = r.attributes.instanceStart,
                                      c = r.attributes.instanceEnd,
                                      d = Math.min(r.instanceCount, l.count),
                                      u = -n.near;
                                  P.at(1, x),
                                      (x.w = 1),
                                      x.applyMatrix4(n.matrixWorldInverse),
                                      x.applyMatrix4(o),
                                      x.multiplyScalar(1 / x.w),
                                      (x.x *= a.x / 2),
                                      (x.y *= a.y / 2),
                                      (x.z = 0),
                                      S.copy(x),
                                      E.multiplyMatrices(n.matrixWorldInverse, s);
                                  for (let n = 0, r = d; n < r; n++) {
                                      if ((b.fromBufferAttribute(l, n), w.fromBufferAttribute(c, n), (b.w = 1), (w.w = 1), b.applyMatrix4(E), w.applyMatrix4(E), b.z > u && w.z > u)) continue;
                                      if (b.z > u) {
                                          const t = b.z - w.z,
                                              e = (b.z - u) / t;
                                          b.lerp(w, e);
                                      } else if (w.z > u) {
                                          const t = w.z - b.z,
                                              e = (w.z - u) / t;
                                          w.lerp(b, e);
                                      }
                                      b.applyMatrix4(o),
                                          w.applyMatrix4(o),
                                          b.multiplyScalar(1 / b.w),
                                          w.multiplyScalar(1 / w.w),
                                          (b.x *= a.x / 2),
                                          (b.y *= a.y / 2),
                                          (w.x *= a.x / 2),
                                          (w.y *= a.y / 2),
                                          L.start.copy(b),
                                          (L.start.z = 0),
                                          L.end.copy(w),
                                          (L.end.z = 0);
                                      const r = L.closestPointToPointParameter(S, !0);
                                      L.at(r, A);
                                      const d = e.MathUtils.lerp(b.z, w.z, r),
                                          h = d >= -1 && d <= 1,
                                          p = S.distanceTo(A) < 0.5 * T;
                                      if (h && p) {
                                          L.start.fromBufferAttribute(l, n), L.end.fromBufferAttribute(c, n), L.start.applyMatrix4(s), L.end.applyMatrix4(s);
                                          const o = new e.Vector3(),
                                              a = new e.Vector3();
                                          P.distanceSqToSegment(L.start, L.end, a, o), i.push({ point: a, pointOnLine: o, distance: P.origin.distanceTo(a), object: t, face: null, faceIndex: n, uv: null, uv2: null });
                                      }
                                  }
                              })(this, o, n));
            }
        }
    }
    class U extends e.LineSegments {
        constructor(t, n, i, o, a = 4473924, s = 8947848) {
            (a = new e.Color(a)), (s = new e.Color(s));
            const r = Math.round(t / n);
            i = (Math.round(i / o) * o) / 2;
            const l = [],
                c = [];
            let d = 0;
            for (let e = -1 * (t = (r * n) / 2); e <= t; e += n) {
                l.push(e, 0, -1 * i, e, 0, i);
                const t = 0 === e ? a : s;
                t.toArray(c, d), (d += 3), t.toArray(c, d), (d += 3), t.toArray(c, d), (d += 3), t.toArray(c, d), (d += 3);
            }
            for (let e = -1 * i; e <= i; e += o) {
                l.push(-1 * t, 0, e, t, 0, e);
                const n = 0 === e ? a : s;
                n.toArray(c, d), (d += 3), n.toArray(c, d), (d += 3), n.toArray(c, d), (d += 3), n.toArray(c, d), (d += 3);
            }
            const u = new e.BufferGeometry();
            u.setAttribute("position", new e.Float32BufferAttribute(l, 3)), u.setAttribute("color", new e.Float32BufferAttribute(c, 3));
            super(u, new e.LineBasicMaterial({ vertexColors: !0, toneMapped: !1 }));
        }
    }
    function D(t, n, i, o) {
        const a = (function (t, n, i) {
                (t *= 0.5), (n *= 0.5), (i *= 0.5);
                const o = new e.BufferGeometry(),
                    a = [];
                return (
                    a.push(
                        -t,
                        -n,
                        -i,
                        -t,
                        n,
                        -i,
                        -t,
                        n,
                        -i,
                        t,
                        n,
                        -i,
                        t,
                        n,
                        -i,
                        t,
                        -n,
                        -i,
                        t,
                        -n,
                        -i,
                        -t,
                        -n,
                        -i,
                        -t,
                        -n,
                        i,
                        -t,
                        n,
                        i,
                        -t,
                        n,
                        i,
                        t,
                        n,
                        i,
                        t,
                        n,
                        i,
                        t,
                        -n,
                        i,
                        t,
                        -n,
                        i,
                        -t,
                        -n,
                        i,
                        -t,
                        -n,
                        -i,
                        -t,
                        -n,
                        i,
                        -t,
                        n,
                        -i,
                        -t,
                        n,
                        i,
                        t,
                        n,
                        -i,
                        t,
                        n,
                        i,
                        t,
                        -n,
                        -i,
                        t,
                        -n,
                        i
                    ),
                    o.setAttribute("position", new e.Float32BufferAttribute(a, 3)),
                    o
                );
            })(t, n, i),
            s = new e.LineSegments(a, new e.LineDashedMaterial({ color: new e.Color(o), dashSize: 3, gapSize: 1 }));
        return s.computeLineDistances(), s;
    }
    class I {
        constructor(t) {
            var n, i, o, a;
            if (
                ((this.parser = new r()),
                (this.backgroundColor = 14737632),
                (this.travelColor = 10027008),
                (this.extrusionColor = 65280),
                (this.renderExtrusion = !0),
                (this.renderTravel = !1),
                (this.singleLayerMode = !1),
                (this.initialCameraPosition = [-100, 400, 450]),
                (this.debug = !1),
                (this.allowDragNDrop = !1),
                (this.beyondFirstMove = !1),
                (this.inches = !1),
                (this.nonTravelmoves = []),
                (this.disposables = []),
                (this.scene = new e.Scene()),
                (this.scene.background = new e.Color(this.backgroundColor)),
                (this.canvas = t.canvas),
                (this.targetId = t.targetId),
                (this.endLayer = t.endLayer),
                (this.startLayer = t.startLayer),
                (this.topLayerColor = t.topLayerColor),
                (this.lastSegmentColor = t.lastSegmentColor),
                (this.lineWidth = t.lineWidth),
                (this.buildVolume = t.buildVolume),
                (this.initialCameraPosition = null !== (n = t.initialCameraPosition) && void 0 !== n ? n : this.initialCameraPosition),
                (this.debug = null !== (i = t.debug) && void 0 !== i ? i : this.debug),
                (this.allowDragNDrop = null !== (o = t.allowDragNDrop) && void 0 !== o ? o : this.allowDragNDrop),
                (this.nonTravelmoves = null !== (a = t.nonTravelMoves) && void 0 !== a ? a : this.nonTravelmoves),
                console.info("Using THREE r" + e.REVISION),
                console.debug("opts", t),
                this.targetId && console.warn("`targetId` is deprecated and will removed in the future. Use `canvas` instead."),
                !this.canvas && !this.targetId)
            )
                throw Error("Set either opts.canvas or opts.targetId");
            if (this.canvas) this.renderer = new e.WebGLRenderer({ canvas: this.canvas, preserveDrawingBuffer: !0 });
            else {
                const t = document.getElementById(this.targetId);
                if (!t) throw new Error("Unable to find element " + this.targetId);
                (this.renderer = new e.WebGLRenderer({ preserveDrawingBuffer: !0 })), (this.canvas = this.renderer.domElement), t.appendChild(this.canvas);
            }
            (this.camera = new e.PerspectiveCamera(25, this.canvas.offsetWidth / this.canvas.offsetHeight, 10, 5e3)), this.camera.position.fromArray(this.initialCameraPosition);
            const s = this.camera.far,
                l = 0.8 * s;
            (this.scene.fog = new e.Fog(this.scene.background, l, s)), this.resize(), (this.controls = new u(this.camera, this.renderer.domElement)), this.animate(), this.allowDragNDrop && this._enableDropHandler();
        }
        get layers() {
            return [this.parser.preamble].concat(this.parser.layers.concat());
        }
        get maxLayerIndex() {
            var t;
            return (null !== (t = this.endLayer) && void 0 !== t ? t : this.layers.length) - 1;
        }
        get minLayerIndex() {
            var t;
            return this.singleLayerMode ? this.maxLayerIndex : (null !== (t = this.startLayer) && void 0 !== t ? t : 0) - 1;
        }
        animate() {
            requestAnimationFrame(() => this.animate()), this.controls.update(), this.renderer.render(this.scene, this.camera);
        }
        processGCode(t) {
            this.parser.parseGCode(t), this.render();
        }
        render() {
            for (var t, n, i, o, a, s, r, l, c; this.scene.children.length > 0; ) this.scene.remove(this.scene.children[0]);
            for (; this.disposables.length > 0; ) this.disposables.pop().dispose();
            if (this.debug) {
                const t = new e.AxesHelper(Math.max(this.buildVolume.x / 2, this.buildVolume.y / 2) + 20);
                this.scene.add(t);
            }
            this.buildVolume && this.drawBuildVolume(), (this.group = new e.Group()), (this.group.name = "gcode");
            const d = { x: 0, y: 0, z: 0, r: 0, e: 0, i: 0, j: 0 };
            for (let u = 0; u < this.layers.length && !(u > this.maxLayerIndex); u++) {
                const h = { extrusion: [], travel: [], z: d.z },
                    p = this.layers[u];
                for (const e of p.commands)
                    if ("g20" == e.gcode) this.setInches();
                    else if (["g0", "g00", "g1", "g01", "g2", "g02", "g3", "g03"].indexOf(e.gcode) > -1) {
                        const l = e,
                            c = {
                                x: null !== (t = l.params.x) && void 0 !== t ? t : d.x,
                                y: null !== (n = l.params.y) && void 0 !== n ? n : d.y,
                                z: null !== (i = l.params.z) && void 0 !== i ? i : d.z,
                                r: null !== (o = l.params.r) && void 0 !== o ? o : d.r,
                                e: null !== (a = l.params.e) && void 0 !== a ? a : d.e,
                                i: null !== (s = l.params.i) && void 0 !== s ? s : d.i,
                                j: null !== (r = l.params.j) && void 0 !== r ? r : d.j,
                            };
                        if (u >= this.minLayerIndex) {
                            const t = l.params.e > 0 || this.nonTravelmoves.indexOf(e.gcode) > -1;
                            ((t && this.renderExtrusion) || (!t && this.renderTravel)) &&
                                ("g2" == e.gcode || "g3" == e.gcode || "g02" == e.gcode || "g03" == e.gcode ? this.addArcSegment(h, d, c, t, "g2" == e.gcode || "g02" == e.gcode) : this.addLineSegment(h, d, c, t));
                        }
                        c.x && (d.x = c.x), c.y && (d.y = c.y), c.z && (d.z = c.z), this.beyondFirstMove || (this.beyondFirstMove = !0);
                    }
                if (this.renderExtrusion) {
                    const t = Math.round((80 * u) / this.layers.length),
                        n = new e.Color(`hsl(0, 0%, ${t}%)`).getHex();
                    if (u == this.layers.length - 1) {
                        const t = null !== (l = this.topLayerColor) && void 0 !== l ? l : n,
                            e = null !== (c = this.lastSegmentColor) && void 0 !== c ? c : t,
                            i = h.extrusion.splice(-3);
                        this.addLine(h.extrusion, t);
                        const o = h.extrusion.splice(-3);
                        this.addLine([...o, ...i], e);
                    } else this.addLine(h.extrusion, n);
                }
                this.renderTravel && this.addLine(h.travel, this.travelColor);
            }
            this.group.quaternion.setFromEuler(new e.Euler(-Math.PI / 2, 0, 0)),
                this.buildVolume ? this.group.position.set(-this.buildVolume.x / 2, 0, this.buildVolume.y / 2) : this.group.position.set(-100, 0, 100),
                this.scene.add(this.group),
                this.renderer.render(this.scene, this.camera);
        }
        setInches() {
            this.beyondFirstMove ? console.warn("Switching units after movement is already made is discouraged and is not supported.") : ((this.inches = !0), console.log("Units set to inches"));
        }
        drawBuildVolume() {
            this.scene.add(new U(this.buildVolume.x, 10, this.buildVolume.y, 10));
            const t = D(this.buildVolume.x, this.buildVolume.z, this.buildVolume.y, 8947848);
            t.position.setY(this.buildVolume.z / 2), this.scene.add(t);
        }
        clear() {
            (this.startLayer = 1), (this.endLayer = 1 / 0), (this.singleLayerMode = !1), (this.parser = new r()), (this.beyondFirstMove = !1);
        }
        resize() {
            const [t, e] = [this.canvas.offsetWidth, this.canvas.offsetHeight];
            (this.camera.aspect = t / e), this.camera.updateProjectionMatrix(), this.renderer.setPixelRatio(window.devicePixelRatio), this.renderer.setSize(t, e, !1);
        }
        addLineSegment(t, e, n, i) {
            (i ? t.extrusion : t.travel).push(e.x, e.y, e.z, n.x, n.y, n.z);
        }
        addArcSegment(t, e, n, i, o) {
            const a = i ? t.extrusion : t.travel,
                s = e.x,
                r = e.y,
                l = e.z,
                c = n.x,
                d = n.y,
                u = n.z;
            let h = n.r,
                p = n.i,
                m = n.j;
            if (h) {
                const t = c - s,
                    e = d - r,
                    n = Math.sqrt(Math.pow(t / 2, 2) + Math.pow(e / 2, 2));
                h = Math.max(h, n);
                const i = Math.pow(t, 2) + Math.pow(e, 2),
                    a = Math.pow(h, 2) - i / 4;
                let l = Math.sqrt(a / i);
                ((o && h < 0) || (!o && h > 0)) && (l = -l), (p = t / 2 + e * l), (m = e / 2 - t * l);
            }
            const f = s == c && r == d,
                g = s + p,
                v = r + m,
                y = Math.sqrt(p * p + m * m),
                b = Math.atan2(-m, -p),
                w = Math.atan2(d - v, c - g);
            let x;
            f ? (x = 2 * Math.PI) : ((x = o ? b - w : w - b), x < 0 && (x += 2 * Math.PI));
            let S = (y * x) / 1.8;
            this.inches && (S *= 25), S < 1 && (S = 1);
            let E = x / S;
            E *= o ? -1 : 1;
            const L = [];
            L.push({ x: s, y: r, z: l });
            const A = (l - u) / S;
            let M = s,
                O = r,
                z = l,
                P = b;
            for (let t = 0; t < S - 1; t++) (P += E), (M = g + y * Math.cos(P)), (O = v + y * Math.sin(P)), (z += A), L.push({ x: M, y: O, z: z });
            L.push({ x: n.x, y: n.y, z: n.z });
            for (let t = 0; t < L.length - 1; t++) a.push(L[t].x, L[t].y, L[t].z, L[t + 1].x, L[t + 1].y, L[t + 1].z);
        }
        addLine(t, n) {
            if ("number" == typeof this.lineWidth && this.lineWidth > 0) return void this.addThickLine(t, n);
            const i = new e.BufferGeometry();
            i.setAttribute("position", new e.Float32BufferAttribute(t, 3)), this.disposables.push(i);
            const o = new e.LineBasicMaterial({ color: n });
            this.disposables.push(o);
            const a = new e.LineSegments(i, o);
            this.group.add(a);
        }
        addThickLine(t, e) {
            if (!t.length) return;
            const n = new g();
            this.disposables.push(n);
            const i = new h({ color: e, linewidth: this.lineWidth / (1e3 * window.devicePixelRatio) });
            this.disposables.push(i), n.setPositions(t);
            const o = new C(n, i);
            this.group.add(o);
        }
        _enableDropHandler() {
            this.canvas.addEventListener("dragover", (t) => {
                t.stopPropagation(), t.preventDefault(), (t.dataTransfer.dropEffect = "copy"), this.canvas.classList.add("dragging");
            }),
                this.canvas.addEventListener("dragleave", (t) => {
                    t.stopPropagation(), t.preventDefault(), this.canvas.classList.remove("dragging");
                }),
                this.canvas.addEventListener("drop", (t) =>
                    n(this, void 0, void 0, function* () {
                        t.stopPropagation(), t.preventDefault(), this.canvas.classList.remove("dragging");
                        const e = t.dataTransfer.files[0];
                        this.clear(), yield this._readFromStream(e.stream()), this.render();
                    })
                );
        }
        _readFromStream(t) {
            var e, i;
            return n(this, void 0, void 0, function* () {
                const n = t.getReader();
                let o,
                    a = "",
                    s = 0;
                do {
                    (o = yield n.read()), (s += null !== (i = null === (e = o.value) || void 0 === e ? void 0 : e.length) && void 0 !== i ? i : 0);
                    const t = ((r = o.value), new TextDecoder("utf-8").decode(r)),
                        l = t.lastIndexOf("\n"),
                        c = t.slice(0, l);
                    this.parser.parseGCode(a + c), (a = t.slice(l));
                } while (!o.done);
                var r;
                console.debug("read from stream", s);
            });
        }
    }
    (t.WebGLPreview = I),
        (t.init = function (t) {
            return new I(t);
        }),
        Object.defineProperty(t, "__esModule", { value: !0 });
});
