import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs'

const isWatching = !!process.env.ROLLUP_WATCH

const config = {
	input: 'src/plugin.js',

	output: {
		file: 'com.ntanis.essentials-for-spotify.sdPlugin/bin/plugin.js',
		inlineDynamicImports: true,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href
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

			buildStart() {
				this.addWatchFile('src/ui')
				this.addWatchFile('src/localization')
				this.addWatchFile('com.ntanis.essentials-for-spotify.sdPlugin/manifest.json')
			}
		},

		{
			name: 'copy-assets',

			generateBundle() {
				const targets = [
					{
						src: 'src/ui/setup',
						dest: 'com.ntanis.essentials-for-spotify.sdPlugin/bin/setup'
					},
					
					{
						src: 'src/ui/overlay',
						dest: 'com.ntanis.essentials-for-spotify.sdPlugin/bin/overlay'
					},

					{
						src: 'src/ui/pi',
						dest: 'com.ntanis.essentials-for-spotify.sdPlugin/pi'
					}
				]

				for (const {
					src,
					dest
				} of targets)
					fs.cpSync(src, dest, {
						recursive: true
					})

				if (fs.existsSync('src/localization')) {
					const piLocales = {}

					for (const file of fs.readdirSync('src/localization')) {
						fs.copyFileSync(path.join('src/localization', file), path.join('com.ntanis.essentials-for-spotify.sdPlugin', file))

						if (file.endsWith('.json')) {
							const lang = file.replace('.json', '')
							const data = JSON.parse(fs.readFileSync(path.join('src/localization', file), 'utf-8'))

							if (data.PropertyInspector)
								piLocales[lang] = data.PropertyInspector
						}
					}

					if (Object.keys(piLocales).length > 0)
						fs.writeFileSync(
							path.join('com.ntanis.essentials-for-spotify.sdPlugin', 'pi', 'locales.js'),
							`SDPIComponents.i18n.locales=${JSON.stringify(piLocales)};`
						)
				}
			}
		}
	]
}

export default config
