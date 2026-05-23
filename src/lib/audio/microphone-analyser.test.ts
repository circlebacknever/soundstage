import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	createMicrophonePitchSource,
	type AudioContextLike,
	type MediaStreamAudioSourceLike
} from './index.ts';
import { generateSineWave } from './waveform.ts';

class FakeMediaStreamAudioSource implements MediaStreamAudioSourceLike {
	connectedTo: unknown;
	disconnectCount = 0;

	connect(node: unknown) {
		this.connectedTo = node;
	}

	disconnect() {
		this.disconnectCount += 1;
	}
}

class FakeAnalyser {
	fftSize: number;

	constructor(private readonly samples: Float32Array) {
		this.fftSize = samples.length;
	}

	getFloatTimeDomainData(target: Float32Array) {
		target.set(this.samples);
	}
}

class FakeAudioContext implements AudioContextLike {
	sampleRate: number;
	source = new FakeMediaStreamAudioSource();
	analyser: FakeAnalyser;
	closed = false;

	constructor(samples: Float32Array, sampleRate: number) {
		this.analyser = new FakeAnalyser(samples);
		this.sampleRate = sampleRate;
	}

	createMediaStreamSource() {
		return this.source;
	}

	createAnalyser() {
		return this.analyser;
	}

	async close() {
		this.closed = true;
	}
}

function fakeStream() {
	const stoppedTracks: string[] = [];
	const stream = {
		getTracks() {
			return [
				{
					id: 'audio-track',
					stop() {
						stoppedTracks.push('audio-track');
					}
				}
			];
		}
	} as unknown as MediaStream;

	return {
		stream,
		stoppedTracks
	};
}

describe('microphone analyser wrapper', () => {
	it('builds the microphone source to analyser graph and reads pitch frames', () => {
		const a4 = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 800
		});
		const { stream } = fakeStream();
		const audioContext = new FakeAudioContext(a4.samples, a4.sampleRate);

		const source = createMicrophonePitchSource({
			stream,
			audioContext
		});

		assert.equal(audioContext.source.connectedTo, audioContext.analyser);

		const frame = source.readPitchFrame({
			stablePitchOptions: {
				windowSize: 1,
				minimumStableEstimates: 1,
				centsTolerance: 6,
				maxUnstableEstimates: 0
			}
		});

		assert.equal(frame.pitch.ok, true);
		assert.equal(frame.stable.output.ok, true);
		if (frame.pitch.ok && frame.stable.output.ok) {
			assert.equal(frame.pitch.note.label, 'A4');
			assert.equal(frame.stable.output.pitch.note.label, 'A4');
		}
	});

	it('stops microphone tracks, disconnects the source, and closes the audio context', async () => {
		const a4 = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 800
		});
		const { stream, stoppedTracks } = fakeStream();
		const audioContext = new FakeAudioContext(a4.samples, a4.sampleRate);
		const source = createMicrophonePitchSource({
			stream,
			audioContext
		});

		await source.stop();

		assert.deepEqual(stoppedTracks, ['audio-track']);
		assert.equal(audioContext.source.disconnectCount, 1);
		assert.equal(audioContext.closed, true);
	});
});
