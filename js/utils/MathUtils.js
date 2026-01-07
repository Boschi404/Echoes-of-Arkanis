class MathUtils {
    constructor(seed = 69) {
        this.seed = seed;
    }

    // Mulberry32 PRNG
    random() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    range(min, max) {
        return min + this.random() * (max - min);
    }

    choice(arr) {
        return arr[Math.floor(this.random() * arr.length)];
    }
}
window.MathUtils = MathUtils;
