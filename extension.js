/* eslint-disable max-lines */
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const requirejs = require('requirejs');
const amodroConfig = require('amodro-trace/config');
const ReferenceProvider = require('./ReferenceProvider');
const CompletionItemProvider = require('./CompletionItemProvider');

// Initialize or re-initialize requirejs for the activated context.
function initializeRequireJs () {
	const requireModuleSupport = vscode.workspace.getConfiguration('requireModuleSupport');
	const rootPath = vscode.workspace.rootPath;

	// Clean up requirejs configuration from the previously activated context.
	// See https://github.com/requirejs/requirejs/issues/1113 for more information.
	delete requirejs.s.contexts._;

	// Handle the existing modulePath property as baseUrl for require.config()
	// to support simple scenarios. More complex projects should supply also
	// configFile in addition to baseUrl to resolve any module path.
	requirejs.config({ baseUrl: path.join(rootPath, requireModuleSupport.get('modulePath')) });

	// Reuse the configuration for debugging a requirejs project for editing too.
	// Prevent maintaining the same configuration in settings.json.
	const configFile = requireModuleSupport.get('configFile');

	if (configFile) {
		const configContent = fs.readFileSync(path.join(rootPath, configFile), 'utf-8');
		const config = amodroConfig.find(configContent);

		if (config) {
			requirejs.config(config);
		}
	}
}

const language = { scheme: 'file', language: 'javascript' };

Object.assign(exports, {
	ReferenceProvider,
	CompletionItemProvider,
	activate (context) {
		initializeRequireJs();
		context.subscriptions.push(
			vscode.workspace.onDidChangeConfiguration(initializeRequireJs));
		context.subscriptions.push(
			vscode.languages.registerDefinitionProvider(
				language,
				new ReferenceProvider()
			)
		);
		context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(
				language,
				new CompletionItemProvider(),
				['.']
			)
		);
	}
});
