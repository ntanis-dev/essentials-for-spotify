import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import copy from 'rollup-plugin-copy'
import path from 'node:path'
import url from 'node:url'

const isWatching = !!process.env.ROLLUP_WATCH

const config = {
	input: 'src/plugin.js',

	output: {
		file: 'com.ntanis.essentials-for-spotify.sdPlugin/bin/plugin.js',
		sourcemap: isWatching,

		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href
		}
	},

	plugins: [
		typescript({
			mapRoot: isWatching ? './' : undefined,
		}),

		nodeResolve({
			browser: false,
			exportConditions: ['node'],
			preferBuiltins: true
		}),

		json(),
		commonjs(),

		(!isWatching) && terser(),

		{
			name: 'emit-module-package-file',

			generateBundle() {
				this.emitFile({
					fileName: 'package.json',
					source: `{"type": "module"}`,
					type: 'asset'
				})
			}
		},

		isWatching && {
			name: 'watch-external',

			buildStart(){
				this.addWatchFile('src/ui')
				this.addWatchFile('com.ntanis.essentials-for-spotify.sdPlugin/manifest.json')
			}
		},

		copy({
			targets: [
				{
					src: 'src/ui/setup',
					dest: 'com.ntanis.essentials-for-spotify.sdPlugin/bin'
				},

				{
					src: 'src/ui/pi',
					dest: 'com.ntanis.essentials-for-spotify.sdPlugin'
				},

				{
					src: 'src/localization/*',
					dest: 'com.ntanis.essentials-for-spotify.sdPlugin'
				}
			]
		})
	]
}

export default config
