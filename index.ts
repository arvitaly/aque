import { Job, Queue } from "kue";
import sleep from "sleep-es6";
(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");

interface IJob<P, R> extends Job {
    result: R;
    data: P;
}

export class Aque<P extends { [index: string]: any }, R extends { [index: string]: any }> {
    constructor(protected kue: Queue, protected JOB: typeof Job) {

    }
    public async *waitComplete<N extends keyof R>(jobType: N): AsyncIterableIterator<IJob<P[N], R[N]>> {
        while (true) {
            for (const job of await this.getRangeByType(jobType, "complete")) {
                yield job;
            }
            await sleep(2000);
        }
    }
    public async process<N extends keyof P>(
        type: N, cb: (
            job: IJob<P[N], R[N]>,
            done: (err: any | null, res: null | R[N]) => void) => any,
    ) {
        this.kue.process(type, cb);
    }
    public create<N extends keyof P>(name: N, params: P[N]) {
        return new Promise((resolve, reject) => {
            this.kue.create(name, params as any).save((err: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    public async createIfNotExists<N extends keyof P>(name: N, params: P[N]): Promise<boolean> {
        if (await this.has(name, params)) {
            return false;
        }
        await this.create(name, params);
        return true;
    }
    public async has<N extends keyof P>(taskType: N, params: P[N]) {
        const isFind = await this.hasNotFailed(taskType, params);
        if (isFind) {
            return true;
        }
        const jobs = await this.getRangeByType(taskType, "failed");
        const found = jobs.filter((j) => JSON.stringify(j.data) === JSON.stringify(params));
        if (found.length > 0) {
            return true;
        }
        return false;
    }
    public async hasNotFailed<N extends keyof P>(taskType: N, params: P[N]) {
        let jobs = await this.getRangeByType(taskType, "complete");
        let found = jobs.filter((j) => jsonify(j.data) === jsonify(params));
        if (found.length > 0) {
            return true;
        }
        jobs = await this.getRangeByType(taskType, "active");
        found = jobs.filter((j) => jsonify(j.data) === jsonify(params));
        if (found.length > 0) {
            return true;
        }
        jobs = await this.getRangeByType(taskType, "inactive");

        found = jobs.filter((j) => {
            return jsonify(j.data) === jsonify(params);
        });
        if (found.length > 0) {
            return true;
        }
        return false;
    }
    public getRangeByType(jobType: keyof P, status: "complete" | "active" | "inactive" | "failed") {
        return new Promise<Job[]>((resolve, reject) => {
            this.JOB.rangeByType(jobType, status, 0, 10000, "asc", (err: any, jobs: Job[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(jobs);
            });
        });
    }
    public removeJob(job: Job) {
        return new Promise((resolve, reject) => {
            job.remove((err: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}
export const jsonify = (sortMyObj: string) => JSON.stringify(sortMyObj, Object.keys(sortMyObj).sort());
export default Aque;
