"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const sleep_es6_1 = require("sleep-es6");
Symbol.asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
class Aque {
    constructor(kue, JOB) {
        this.kue = kue;
        this.JOB = JOB;
    }
    waitComplete(jobType) {
        return __asyncGenerator(this, arguments, function* waitComplete_1() {
            while (true) {
                for (const job of yield __await(this.getRangeByType(jobType, "complete"))) {
                    yield job;
                }
                yield __await(sleep_es6_1.default(2000));
            }
        });
    }
    process(type, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            this.kue.process(type, cb);
        });
    }
    create(name, params) {
        return new Promise((resolve, reject) => {
            this.kue.create(name, params).save((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    createIfNotExists(name, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.has(name, params)) {
                return false;
            }
            yield this.create(name, params);
            return true;
        });
    }
    has(taskType, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const isFind = yield this.hasNotFailed(taskType, params);
            if (isFind) {
                return true;
            }
            const jobs = yield this.getRangeByType(taskType, "failed");
            const found = jobs.filter((j) => JSON.stringify(j.data) === JSON.stringify(params));
            if (found.length > 0) {
                return true;
            }
            return false;
        });
    }
    hasNotFailed(taskType, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let jobs = yield this.getRangeByType(taskType, "complete");
            let found = jobs.filter((j) => exports.jsonify(j.data) === exports.jsonify(params));
            if (found.length > 0) {
                return true;
            }
            jobs = yield this.getRangeByType(taskType, "active");
            found = jobs.filter((j) => exports.jsonify(j.data) === exports.jsonify(params));
            if (found.length > 0) {
                return true;
            }
            jobs = yield this.getRangeByType(taskType, "inactive");
            found = jobs.filter((j) => {
                return exports.jsonify(j.data) === exports.jsonify(params);
            });
            if (found.length > 0) {
                return true;
            }
            return false;
        });
    }
    getRangeByType(jobType, status) {
        return new Promise((resolve, reject) => {
            this.JOB.rangeByType(jobType, status, 0, 10000, "asc", (err, jobs) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(jobs);
            });
        });
    }
    removeJob(job) {
        return new Promise((resolve, reject) => {
            job.remove((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}
exports.Aque = Aque;
exports.jsonify = (sortMyObj) => JSON.stringify(sortMyObj, Object.keys(sortMyObj).sort());
exports.default = Aque;
