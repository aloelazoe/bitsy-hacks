import fs from 'fs';
import {
	basename
} from "path";

import rollup from "rollup";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

const fsp = fs.promises;

let cache;
var currdatetime;

export async function buildOne(src = '', plugins = [], externalDeps = {}) {
	console.log('before parsing cache');
	currdatetime = new Date();
	console.log(currdatetime);
	try {
		cache = JSON.parse(await fsp.readFile('rollup-cache.json'));
	}
	catch (err) {
		console.log('something went wrong when parsing cache!');
		console.error(err);
		cache = undefined;
	}
	console.log('after parsing cache');
	currdatetime = new Date();
	console.log(currdatetime);

	const inputOptions = {
		cache,
		input: src,
		external: [
			'bitsy'
		].concat(Object.keys(externalDeps)),
		plugins: [
			nodeResolve(),
			commonjs()
		].concat(plugins)
	};

	const outputOptions = {
		format: "iife",
		globals: Object.assign({
			bitsy: 'window'
		}, externalDeps),
		name: `hacks.${basename(src, '.js').replace(/\s/g,'_')}`,
	};

	const bundle = await rollup.rollup(inputOptions);

	cache = bundle.cache;
	console.log('before writing to cache');
	currdatetime = new Date();
	console.log(currdatetime);
	try {
		await fsp.writeFile('rollup-cache.json', JSON.stringify(cache));
	}
	catch (err) {
		console.log('something went wrong when writing to cache!');
		console.error(err);
		cache = undefined;
	}
	console.log('after writing to cache');
	currdatetime = new Date();
	console.log(currdatetime);

	const output = await bundle.generate(outputOptions);
	console.log('before returning');
	currdatetime = new Date();
	console.log(currdatetime);
	return output.code;
}

export async function build(hacks = [], plugins, externalDeps) {
	const output = await Promise.all(hacks.map(hack => buildOne(hack, plugins, externalDeps)));
	return output;
}
