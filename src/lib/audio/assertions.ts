export function assertFinitePositive(value: number, label: string) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new RangeError(`${label} must be a finite positive number`);
	}
}

export function assertNonNegative(value: number, label: string) {
	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError(`${label} must be a finite non-negative number`);
	}
}

export function assertThreshold(value: number, label: string) {
	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError(`${label} must be a finite non-negative number`);
	}
}

export function assertPositiveInteger(value: number, label: string) {
	if (!Number.isInteger(value) || value <= 0) {
		throw new RangeError(`${label} must be a positive integer`);
	}
}

export function assertNonNegativeInteger(value: number, label: string) {
	if (!Number.isInteger(value) || value < 0) {
		throw new RangeError(`${label} must be a non-negative integer`);
	}
}
