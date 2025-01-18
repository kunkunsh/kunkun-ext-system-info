import { get, writable } from 'svelte/store';
import { CpuInfo, MemoryInfo, Component } from 'tauri-plugin-system-info-api';

export type QPayload<T> = {
	value: T;
	timestamp: Date;
};

export function createQueueStore<T>(maxSize: number) {
	const store = writable<QPayload<T>[]>([]);

	return {
		...store,
		enqueue: (value: T) => {
			store.update((q) => {
				q.push({ value, timestamp: new Date() });
				if (q.length > maxSize) {
					q.shift();
				}
				return q;
			});
		},
		dequeue: () => {
			let item = get(store)?.shift();
			store.update((q) => q.slice(1));
			return item;
		},
		last: (n: number) => get(store)?.slice(-n),
		data: () => get(store)
	};
}
export const cpuStore = createQueueStore<CpuInfo>(10);
export const memoryStore = createQueueStore<MemoryInfo>(10);
export const componentStore = createQueueStore<Component>(10);
