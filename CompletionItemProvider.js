/* eslint-disable max-lines */
const vscode = require('vscode');

const safeEval = require('safe-eval');
const ReferenceProvider = require('./ReferenceProvider');

class CompletionItemProvider {
	constructor () {
		this.refProvider = new ReferenceProvider();
		this.firstSearch = false;
		this.properties = {};

		this.handleDefineRequire = (properties) => (_1, _2, _3) => {
			if (typeof _1 === 'string') {
				if (typeof _2 === 'function') {
					const Result = _2();

					properties[_1] = typeof Result === 'object' ? Result : new Result();
				} else if (typeof _3 === 'function') {
					const Result = _3();

					properties[_1] = typeof Result === 'object' ? Result : new Result();
				}
			}
		};
	}

	provideCompletionItems (document, position) {
		const defs = this.refProvider.provideDefinition(document, new vscode.Position(position.line, position.character - 1));

		this.firstSearch = true;

		const promises = [];

		return defs.then((definitions) => {
			if (this.firstSearch) {
				this.firstSearch = false;

				const properties = {};

				for (let i = 0; i < definitions.length; i++) {
					const currentRef = definitions[i];


					const newDocument = vscode.workspace.openTextDocument(currentRef.uri);

					promises.push(newDocument.then((doc) => {
						const newFullText = doc.getText();

						const requires = this.refProvider.getRequireOrDefineStatements(newFullText);

						for (let j = 0; j < requires.length; j++) {
							const currentRequire = requires[j];

							const contents = doc.getText(new vscode.Range(
								doc.positionAt(currentRequire.start),
								doc.positionAt(currentRequire.end)
							));

							safeEval(contents, {
								require: this.handleDefineRequire(properties),
								define: this.handleDefineRequire(properties)
							});
						}

						let propertyNames = [];

						for (let key in properties) {
							const props = Object.getOwnPropertyNames(properties[key]);

							propertyNames = propertyNames.concat(props.map((name) => ({name, type: typeof properties[key][name]})));
						}

						return propertyNames.map(({ name, type }) => {
							switch (type) {
							case 'function':
								return new vscode.CompletionItem(name, vscode.CompletionItemKind.Method);
							default:
								return new vscode.CompletionItem(name, vscode.CompletionItemKind.Property);
							}
						});
					}));
				}
			}

			return Promise.all(promises).then((...completionItemArrays) => {
				return new vscode.CompletionList(completionItemArrays.reduce((accum, array) => {
					return accum.concat(array.reduce((innerAccum, innerArray) => {
						return innerAccum.concat(innerArray);
					}, []));
				}, []));
			});
		});
	}
}

module.exports = CompletionItemProvider;
