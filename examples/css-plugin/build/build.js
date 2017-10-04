{
	baseUrl: '..',
	mainConfigFile: '../config.js',
	dir: 'out',
	optimize: 'none',
	generateSourceMaps: true,
	removeCombined: true,
	fileExclusionRegExp: /^(?:\.vscode|node_modules|r\.js)$|^(?:build|config)|(?:\.html|\.json)$/,
	separateCSS: true,
	modules: [
		{
			name: 'main',
			include: ['libraries/require']
		}
	]
}
