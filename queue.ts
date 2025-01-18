type QPayload<T> = {
    data: T;
    timestamp: Date;
};

class Q<T> {
    private queue: QPayload<T>[] = [];

    constructor(private maxSize: number) {}

    enqueue(item: T) {
        if (this.queue.length >= this.maxSize) {
            throw new Error("Queue is full");
        }
        this.queue.push({ data: item, timestamp: new Date() });
    }

    
}
