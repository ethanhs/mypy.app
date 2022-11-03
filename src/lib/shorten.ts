import Redis from 'ioredis';

class Shortener {
	redis: Redis;
	constructor() {
		let slug = process.env.REDIS_SLUG;
		if (slug === undefined) {
			throw new Error('You must set REDIS_SLUG to point to a redis server.');
		}
		this.redis = new Redis(slug);
	}

	public async shorten(value: string): Promise<string> {
		let key = crypto.randomUUID();
		await this.redis.set(key, value);
		return key;
	}

	public async unshorten(key: string): Promise<string | null> {
		let value = await this.redis.get(key);
		if (value === null) {
			return value;
		} else {
			return value;
		}
	}
}

export default Shortener;
