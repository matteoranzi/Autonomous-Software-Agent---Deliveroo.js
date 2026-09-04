// Fixed-capacity ring buffer: push is O(1) (unlike Array.shift(), which is O(n)),
// and once full, the oldest element is silently overwritten.
class CircularBuffer<T> {
    private readonly capacity: number;
    private readonly buffer: (T | undefined)[];
    private head: number = 0; // index the next push() writes to
    private size: number = 0; // number of items currently stored (<= capacity)

    constructor(capacity: number) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
    }

    get length(): number {
        return this.size;
    }

    push(item: T): void {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        this.size = Math.min(this.size + 1, this.capacity);
    }

    clear(): void {
        this.head = 0;
        this.size = 0;
    }

    get latest(): T | undefined {
        if (this.size === 0) {
            return undefined;
        }
        const lastWriteIndex = (this.head - 1 + this.capacity) % this.capacity;
        return this.buffer[lastWriteIndex];
    }

    // Oldest -> newest.
    toArray(): T[] {
        if (this.size < this.capacity) {
            return this.buffer.slice(0, this.size) as T[];
        }
        return [
            ...this.buffer.slice(this.head),
            ...this.buffer.slice(0, this.head),
        ] as T[];
    }
}

export { CircularBuffer };