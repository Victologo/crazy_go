export class SeededRandom {
    private static s: number = 12345;

    public static setSeed(seed: number) {
        this.s = seed || 12345;
        // warm up
        for (let i = 0; i < 10; i++) this.next();
    }

    public static next(): number {
        this.s = (this.s * 16807) % 2147483647;
        return (this.s - 1) / 2147483646;
    }

    public static nextInt(max: number): number {
        return Math.floor(this.next() * max);
    }
}
