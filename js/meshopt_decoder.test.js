var assert = require('assert').strict;
var decoder = require('./meshopt_decoder.js');

process.on('unhandledRejection', (error) => {
	console.log('unhandledRejection', error);
	process.exit(1);
});

var tests = {
	decodeVertexBuffer: function () {
		var encoded = new Uint8Array([
			0xa0, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x58, 0x57, 0x58, 0x01, 0x26, 0x00, 0x00, 0x00, 0x01, 0x0c, 0x00, 0x00, 0x00, 0x58, 0x01, 0x08, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x17, 0x18, 0x17, 0x01, 0x26, 0x00, 0x00, 0x00, 0x01, 0x0c, 0x00, 0x00,
			0x00, 0x17, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		]);

		var expected = new Uint8Array([
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 1, 0, 0, 0, 0, 0, 0, 244, 1, 0, 0, 0, 0, 44, 1, 0, 0, 0, 0, 0, 0, 244, 1, 44, 1, 44, 1, 0, 0, 0,
			0, 244, 1, 244, 1,
		]);

		var result = new Uint8Array(expected.length);
		decoder.decodeVertexBuffer(result, 4, 12, encoded);

		assert.deepStrictEqual(result, expected);
	},

	decodeVertexBuffer_More: function () {
		var encoded = new Uint8Array([
			0xa0, 0x00, 0x01, 0x2a, 0xaa, 0xaa, 0xaa, 0x02, 0x04, 0x44, 0x44, 0x44, 0x44, 0x44, 0x44, 0x44, 0x03, 0x00, 0x10, 0x10, 0x10, 0x10, 0x10,
			0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		]);

		var expected = new Uint8Array([
			0, 0, 0, 0, 0, 1, 2, 8, 0, 2, 4, 16, 0, 3, 6, 24, 0, 4, 8, 32, 0, 5, 10, 40, 0, 6, 12, 48, 0, 7, 14, 56, 0, 8, 16, 64, 0, 9, 18, 72, 0,
			10, 20, 80, 0, 11, 22, 88, 0, 12, 24, 96, 0, 13, 26, 104, 0, 14, 28, 112, 0, 15, 30, 120,
		]);

		var result = new Uint8Array(expected.length);
		decoder.decodeVertexBuffer(result, 16, 4, encoded);

		assert.deepStrictEqual(result, expected);
	},

	decodeVertexBuffer_Mode2: function () {
		var encoded = new Uint8Array([
			0xa0, 0x02, 0x08, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x02, 0x0a, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0x02, 0x0c, 0xcc, 0xcc,
			0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0x02, 0x0e, 0xee, 0xee, 0xee, 0xee, 0xee, 0xee, 0xee, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		]);

		var expected = new Uint8Array([
			0, 0, 0, 0, 4, 5, 6, 7, 8, 10, 12, 14, 12, 15, 18, 21, 16, 20, 24, 28, 20, 25, 30, 35, 24, 30, 36, 42, 28, 35, 42, 49, 32, 40, 48, 56, 36,
			45, 54, 63, 40, 50, 60, 70, 44, 55, 66, 77, 48, 60, 72, 84, 52, 65, 78, 91, 56, 70, 84, 98, 60, 75, 90, 105,
		]);

		var result = new Uint8Array(expected.length);
		decoder.decodeVertexBuffer(result, 16, 4, encoded);

		assert.deepStrictEqual(result, expected);
	},

	decodeIndexBuffer16: function () {
		var encoded = new Uint8Array([
			0xe0, 0xf0, 0x10, 0xfe, 0xff, 0xf0, 0x0c, 0xff, 0x02, 0x02, 0x02, 0x00, 0x76, 0x87, 0x56, 0x67, 0x78, 0xa9, 0x86, 0x65, 0x89, 0x68, 0x98,
			0x01, 0x69, 0x00, 0x00,
		]);

		var expected = new Uint16Array([0, 1, 2, 2, 1, 3, 4, 6, 5, 7, 8, 9]);

		var result = new Uint16Array(expected.length);
		decoder.decodeIndexBuffer(new Uint8Array(result.buffer), 12, 2, encoded);

		assert.deepEqual(result, expected);
	},

	decodeIndexBuffer32: function () {
		var encoded = new Uint8Array([
			0xe0, 0xf0, 0x10, 0xfe, 0xff, 0xf0, 0x0c, 0xff, 0x02, 0x02, 0x02, 0x00, 0x76, 0x87, 0x56, 0x67, 0x78, 0xa9, 0x86, 0x65, 0x89, 0x68, 0x98,
			0x01, 0x69, 0x00, 0x00,
		]);

		var expected = new Uint32Array([0, 1, 2, 2, 1, 3, 4, 6, 5, 7, 8, 9]);

		var result = new Uint32Array(expected.length);
		decoder.decodeIndexBuffer(new Uint8Array(result.buffer), 12, 4, encoded);

		assert.deepStrictEqual(result, expected);
	},

	decodeIndexBufferV1: function () {
		var encoded = new Uint8Array([
			0xe1, 0xf0, 0x10, 0xfe, 0x1f, 0x3d, 0x00, 0x0a, 0x00, 0x76, 0x87, 0x56, 0x67, 0x78, 0xa9, 0x86, 0x65, 0x89, 0x68, 0x98, 0x01, 0x69, 0x00,
			0x00,
		]);

		var expected = new Uint32Array([0, 1, 2, 2, 1, 3, 0, 1, 2, 2, 1, 5, 2, 1, 4]);

		var result = new Uint32Array(expected.length);
		decoder.decodeIndexBuffer(new Uint8Array(result.buffer), 15, 4, encoded);

		assert.deepStrictEqual(result, expected);
	},

	decodeIndexBufferV1_More: function () {
		var encoded = new Uint8Array([
			0xe1, 0xf0, 0x10, 0xfe, 0xff, 0xf0, 0x0c, 0xff, 0x02, 0x02, 0x02, 0x00, 0x76, 0x87, 0x56, 0x67, 0x78, 0xa9, 0x86, 0x65, 0x89, 0x68, 0x98,
			0x01, 0x69, 0x00, 0x00,
		]);

		var expected = new Uint32Array([0, 1, 2, 2, 1, 3, 4, 6, 5, 7, 8, 9]);

		var result = new Uint32Array(expected.length);
		decoder.decodeIndexBuffer(new Uint8Array(result.buffer), 12, 4, encoded);

		assert.deepStrictEqual(result, expected);
	},

	decodeIndexBufferV1_3Edges: function () {
		var encoded = new Uint8Array([
			0xe1, 0xf0, 0x20, 0x30, 0x40, 0x00, 0x76, 0x87, 0x56, 0x67, 0x78, 0xa9, 0x86, 0x65, 0x89, 0x68, 0x98, 0x01, 0x69, 0x00, 0x00,
		]);
		var expected = new Uint32Array([0, 1, 2, 1, 0, 3, 2, 1, 4, 0, 2, 5]);

		var result = new Uint32Array(expected.length);
		decoder.decodeIndexBuffer(new Uint8Array(result.buffer), 12, 4, encoded);

		assert.deepStrictEqual(result, expected);
	},

	decodeIndexSequence: function () {
		var encoded = new Uint8Array([0xd1, 0x00, 0x04, 0xcd, 0x01, 0x04, 0x07, 0x98, 0x1f, 0x00, 0x00, 0x00, 0x00]);

		var expected = new Uint32Array([0, 1, 51, 2, 49, 1000]);

		var result = new Uint32Array(expected.length);
		decoder.decodeIndexSequence(new Uint8Array(result.buffer), 6, 4, encoded);

		assert.deepStrictEqual(result, expected);
	},

	decodeFilterOct8: function () {
		var encoded = new Uint8Array([
			0xa0, 0x01, 0x07, 0x00, 0x00, 0x00, 0x1e, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x8b, 0x8c, 0xfd, 0x00, 0x01, 0x26, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x01, 0x7f, 0x00,
		]);

		var expected = new Uint8Array([0, 1, 127, 0, 0, 159, 82, 1, 255, 1, 127, 0, 1, 130, 241, 1]);

		var result = new Uint8Array(expected.length);
		decoder.decodeVertexBuffer(new Uint8Array(result.buffer), 4, 4, encoded, /* filter= */ 'OCTAHEDRAL');

		assert.deepStrictEqual(result, expected);
	},

	decodeFilterOct12: function () {
		var encoded = new Uint8Array([
			0xa0, 0x01, 0x0f, 0x00, 0x00, 0x00, 0x3d, 0x5a, 0x01, 0x0f, 0x00, 0x00, 0x00, 0x0e, 0x0d, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x9a, 0x99, 0x26,
			0x01, 0x3f, 0x00, 0x00, 0x00, 0x0e, 0x0d, 0x0a, 0x00, 0x00, 0x01, 0x26, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0xff, 0x07,
			0x00, 0x00,
		]);

		var expected = new Uint16Array([0, 16, 32767, 0, 0, 32621, 3088, 1, 32764, 16, 471, 0, 307, 28541, 16093, 1]);

		var result = new Uint16Array(expected.length);
		decoder.decodeVertexBuffer(new Uint8Array(result.buffer), 4, 8, encoded, /* filter= */ 'OCTAHEDRAL');

		assert.deepStrictEqual(result, expected);
	},

	decodeFilterQuat12: function () {
		var encoded = new Uint8Array([
			0xa0, 0x01, 0x0f, 0x00, 0x00, 0x00, 0x3d, 0x5a, 0x01, 0x0f, 0x00, 0x00, 0x00, 0x0e, 0x0d, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x9a, 0x99, 0x26,
			0x01, 0x3f, 0x00, 0x00, 0x00, 0x0e, 0x0d, 0x0a, 0x00, 0x00, 0x01, 0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
			0xfc, 0x07,
		]);

		var expected = new Uint16Array([32767, 0, 11, 0, 0, 25013, 0, 21166, 11, 0, 23504, 22830, 158, 14715, 0, 29277]);

		var result = new Uint16Array(expected.length);
		decoder.decodeVertexBuffer(new Uint8Array(result.buffer), 4, 8, encoded, /* filter= */ 'QUATERNION');

		assert.deepStrictEqual(result, expected);
	},

	decodeFilterExp: function () {
		var encoded = new Uint8Array([
			0xa0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0xff, 0xf7, 0xff, 0xff, 0x02, 0xff,
			0xff, 0x7f, 0xfe,
		]);

		var expected = new Uint32Array([0, 0x3fc00000, 0xc2100000, 0x49fffffe]);

		var result = new Uint32Array(expected.length);
		decoder.decodeVertexBuffer(new Uint8Array(result.buffer), 1, 16, encoded, /* filter= */ 'EXPONENTIAL');

		assert.deepStrictEqual(result, expected);
	},

	decodeFilterColor8: function () {
		var encoded = new Uint8Array([
			0xa0, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x7e, 0x7d, 0x4c, 0x01, 0x3f, 0x00, 0x00, 0x00, 0xfd, 0xfd, 0xfe, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x83,
			0x82, 0x80, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x7d, 0x3f, 0x7e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x7f, 0xc1, 0xff,
		]);

		var expected = new Uint8Array([254, 1, 0, 255, 0, 254, 0, 128, 1, 0, 255, 64, 102, 102, 102, 191]);

		var result = new Uint8Array(expected.length);
		decoder.decodeVertexBuffer(new Uint8Array(result.buffer), 4, 4, encoded, /* filter= */ 'COLOR');

		assert.deepStrictEqual(result, expected);
	},

	decodeFilterColor12: function () {
		var encoded = new Uint8Array([
			0xa0, 0x01, 0x1b, 0x00, 0x00, 0x00, 0xcc, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x06, 0x05, 0x04, 0x01, 0x29, 0x00, 0x00, 0x00, 0x01, 0x3f, 0x00,
			0x00, 0x00, 0x0d, 0x0f, 0x10, 0x01, 0x38, 0x00, 0x00, 0x00, 0x03, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x16, 0x15, 0x08, 0x01, 0x21, 0x00, 0x00,
			0x00, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x05, 0x03, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0xff, 0x07, 0x01, 0xfc, 0xff, 0x0f,
		]);

		var expected = new Uint16Array([65519, 16, 0, 65535, 0, 65519, 0, 32776, 16, 0, 65535, 16388, 26214, 26214, 26214, 49147]);

		var result = new Uint16Array(expected.length);
		decoder.decodeVertexBuffer(new Uint8Array(result.buffer), 4, 8, encoded, /* filter= */ 'COLOR');

		assert.deepStrictEqual(result, expected);
	},

	decodeGltfBuffer: function () {
		var encoded = new Uint8Array([
			0xa0, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x58, 0x57, 0x58, 0x01, 0x26, 0x00, 0x00, 0x00, 0x01, 0x0c, 0x00, 0x00, 0x00, 0x58, 0x01, 0x08, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x17, 0x18, 0x17, 0x01, 0x26, 0x00, 0x00, 0x00, 0x01, 0x0c, 0x00, 0x00,
			0x00, 0x17, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		]);

		var expected = new Uint8Array([
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 1, 0, 0, 0, 0, 0, 0, 244, 1, 0, 0, 0, 0, 44, 1, 0, 0, 0, 0, 0, 0, 244, 1, 44, 1, 44, 1, 0, 0, 0,
			0, 244, 1, 244, 1,
		]);

		var result = new Uint8Array(expected.length);
		decoder.decodeGltfBuffer(result, 4, 12, encoded, /* mode= */ 'ATTRIBUTES');
		assert.deepStrictEqual(result, expected);
	},

	decodeGltfBufferAsync: function () {
		var encoded = new Uint8Array([
			0xa0, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x58, 0x57, 0x58, 0x01, 0x26, 0x00, 0x00, 0x00, 0x01, 0x0c, 0x00, 0x00, 0x00, 0x58, 0x01, 0x08, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x17, 0x18, 0x17, 0x01, 0x26, 0x00, 0x00, 0x00, 0x01, 0x0c, 0x00, 0x00,
			0x00, 0x17, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		]);

		var expected = new Uint8Array([
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 1, 0, 0, 0, 0, 0, 0, 244, 1, 0, 0, 0, 0, 44, 1, 0, 0, 0, 0, 0, 0, 244, 1, 44, 1, 44, 1, 0, 0, 0,
			0, 244, 1, 244, 1,
		]);

		decoder.decodeGltfBufferAsync(4, 12, encoded, /* mode= */ 'ATTRIBUTES').then(function (result) {
			assert.deepStrictEqual(result, expected);
		});
	},
};

decoder.ready.then(() => {
	var count = 0;

	for (var key in tests) {
		tests[key]();
		count++;
	}

	console.log(count, 'tests passed');
});
