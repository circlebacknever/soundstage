import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	createMicrophonePitchSource,
	type AudioContextLike,
	type MediaStreamAudioSourceLike
} from '../index.ts';
import { generateSineWave } from '../waveform.ts';

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
	state: AudioContextState = 'running';
	resumeCount = 0;
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

	async resume() {
		this.resumeCount += 1;
		this.state = 'running';
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
		// createMicrophonePitchSource forces analyser.fftSize to 4096, so the fake must
		// hand back a full 4096-sample window — a shorter buffer reads as a tone padded
		// with zeros and mis-detects.
		const a4 = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 4096
		});
		const { stream } = fakeStream();
		const audioContext = new FakeAudioContext(a4.samples, a4.sampleRate);

		const source = createMicrophonePitchSource({
			stream,
			audioContext
		});

		assert.equal(audioContext.source.connectedTo, audioContext.analyser);
		assert.equal(audioContext.resumeCount, 0);

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

	it('wakes a suspended audio context before reading live guitar input', () => {
		const a4 = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 800
		});
		const { stream } = fakeStream();
		const audioContext = new FakeAudioContext(a4.samples, a4.sampleRate);
		audioContext.state = 'suspended';

		createMicrophonePitchSource({
			stream,
			audioContext
		});

		assert.equal(audioContext.resumeCount, 1);
		assert.equal(audioContext.state, 'running');
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
