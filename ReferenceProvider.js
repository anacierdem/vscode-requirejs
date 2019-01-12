/* eslint-disable max-lines */
const vscode = require('vscode');
const path = require('path');
const requirejs = require('requirejs');

class ReferenceProvider {
	/**
	 * Return array containing object with start index of require/define and result
	 * @param {String} str String to process
	 * @returns {Array} containing objects
	 */
	getRequireOrDefineStatements (str) {
		let requireModuleSupport = vscode.workspace.getConfiguration('requireModuleSupport');
		let requireName = requireModuleSupport.get('requireName') || 'require';
		let defineName = requireModuleSupport.get('defineName') || 'define';
		let match = new RegExp('^[\\s]*(' + defineName + '|' + requireName + ')\\s*\\([^]*?([{>])', 'mgi');

		let list = [];
		let searchResult;

		do {
			searchResult = match.exec(String(str));
			if (searchResult && searchResult[0]) {
				// Set previous item's length
				if (list[list.length - 1]) {
					list[list.length - 1].end = searchResult.index;
				}

				list.push({
					start: searchResult.index,
					end: Infinity,
					contents: searchResult[0]
				});
			}
		} while (searchResult);

		return list;
	}

	/**
		 * Returns obj with name/path pairs from define/require statement
		 * @param {String} str String to process
		 * @returns {Object} Contains name/path pairs
		 */
	getModulesWithPathFromRequireOrDefine (str) {
		let list, result;
		const array = /\[[^\]]*\]/gi;
		const params = /(?:function\s*\(([^)]*))|(?:(?:(?:\(([a-zA-Z,\s\t]*)\))|([a-zA-Z0-9]+))(?=[\s\t]*=>))/i;

		// Remove comments, which would make JSON.parse fail. Not the optimal solution;
		// see https://stackoverflow.com/a/15123777/623816 for more information.
		const cleanedStr = str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');

		let m = array.exec(cleanedStr);

		if (m) {
			list = JSON.parse(m[0].split('\'').join('"'));
		}

		if (!list || list.length === 0) {
			return {};
		}

		m = params.exec(cleanedStr);

		if (m && (m[1] || m[2] || m[3])) {
			const test = /([^\s,]+)/g;

			result = (m[1] || m[2] || m[3]).match(test);
		}

		const moduleList = {};

		if (result) {
			result.forEach((value, index) => {
				moduleList[value] = list[index];
			});
		}

		return moduleList;
	}

	/**
		 * finds commented out regions of string
		 * @param {String} str String to process
		 * @returns {Array} Array of objects containing start + end indexes for comment
		 */
	findComments (str) {
		const comments = /(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/mg;

		let list = [];
		let searchResult;

		do {
			searchResult = comments.exec(String(str));
			if (searchResult && searchResult[0]) {
				list.push({
					start: searchResult.index,
					end: searchResult.index + searchResult[0].length
				});
			}
		} while (searchResult);

		return list;
	}

	/**
		 * Search for constructor patterns in haystack and return locations
		 * @param {Document} document VSCode document
		 * @param {String} needle Constructor to search for
		 * @param {String} haystack Text to search for constructor
		 * @param {Integer} [startOffset = 0] Offset to start searching for constructor
		 * @param {Integer} [endOffset = Infinity] Offset limiting search
		 * @returns {Array} Array containing references
		 */
	findConstructor (document, needle, haystack, startOffset = 0, endOffset = Infinity) {
		const test = new RegExp('\\b(?:' + needle + '\\s*=\\s*(?:new)?\\s*)([^\\s(;]*)', 'g');

		test.lastIndex = startOffset;
		let searchResult;

		const references = [];

		do {
			searchResult = test.exec(haystack);
			if (searchResult && searchResult.index <= endOffset) {
				const newPosition = document.positionAt(searchResult.index + searchResult[0].length);

				const range = document.getWordRangeAtPosition(newPosition);

				if (range) {
					references.push(new vscode.Location(document.uri, range));
				}
			}
		} while (searchResult);

		return references;
	}

	/**
		 * Computes an absolute path to the file representing the RequireJS module dependency.
		 * @param {String} modulePath Require path of the target module
		 * @param {String} currentFilePath Current file path to start search from
		 * @returns {String} the file location
		 */
	resolveModulePath (modulePath, currentFilePath) {
		// Plugins, which load other files follow the syntax "plugin!parameter",
		// where "parameter" is usually another module path to be resolved.
		const pluginSeparator = modulePath.indexOf('!');
		let filePath;

		if (pluginSeparator > 0) {
			const pluginExtensions = vscode.workspace.getConfiguration('requireModuleSupport').get('pluginExtensions');
			const pluginName = modulePath.substr(0, pluginSeparator);

			filePath = modulePath.substr(pluginSeparator + 1);
			// Plugins may optionally append their known file extensions.
			if (pluginExtensions) {
				const pluginExtension = pluginExtensions[pluginName];

				if (pluginExtension && !filePath.endsWith(pluginExtension)) {
					filePath += pluginExtension;
				}
			}
		} else {
			// The requirejs.toUrl method does not append '.js' to the resolved path.
			filePath = modulePath + '.js';
		}

		// The global requirejs.toUrl does not resolve relative module paths.
		if (filePath.startsWith('./')) {
			filePath = path.join(path.dirname(currentFilePath), filePath);
		}

		return path.normalize(requirejs.toUrl(filePath));
	}

	/**
		 * Diverges the search to the given module
		 * @param {String} currentFilePath Current file path to start search from
		 * @param {String} modulePath Require path of the target module
		 * @param {String} searchFor The string to search for inside the module
		 * @param {Bool} stopSearchingFurther If set to true, do not continue following definitions.
		 * @returns {Promise} resolves with file location
		 */
	searchModule (currentFilePath, modulePath, searchFor, stopSearchingFurther) {
		const newUri = vscode.Uri.file(this.resolveModulePath(modulePath, currentFilePath));
		const newDocument = vscode.workspace.openTextDocument(newUri);

		return new Promise(resolve => {
			newDocument.then(doc => {
				const newFullText = doc.getText();
				const test = new RegExp('(\\b' + searchFor + '\\b)', 'g');
				let searchResult;
				let found = false;

				const onlyNavigateToFile = vscode.workspace.getConfiguration('requireModuleSupport').get('onlyNavigateToFile');

				if (!onlyNavigateToFile && searchFor) {
					do {
						searchResult = test.exec(newFullText);

						if (searchResult) {
							found = true;
							const newPosition = doc.positionAt(searchResult.index);

							// If not inside a comment, continue at this reference
							const simpleComment = /^\s*\*/gm;

							if (!simpleComment.test(doc.lineAt(newPosition._line).text)) {
								if (stopSearchingFurther) {
									resolve(new vscode.Location(newUri, newPosition));

									return;
								}

								// Invoke a new providerbeginning from the new location
								vscode.commands.executeCommand('vscode.executeDefinitionProvider', newUri, newPosition).then(refs => {
									if (refs.length > 0) {
										resolve(refs);
									} else {
										resolve(new vscode.Location(newUri, newPosition));
									}
								});

								return;
							}
						}
					} while (searchResult);
				}

				// Only navigate to the file
				if (!found || onlyNavigateToFile) {
					resolve(new vscode.Location(newUri, new vscode.Position(0, 0)));
				}
			}, () => resolve(undefined));
		});
	}

	/**
		 * returns the string literal's contents in document covering range
		 * @param {Document} document VSCode Document to extract the string
		 * @param {Range} range VSCode Seed range
		 * @returns {String} extracted string
		 */
	extractString (document, range) {
		if (range._end._line !== range._start._line) {
			return false;
		}

		const line = document.lineAt(range._start._line).text;

		const matchString = new RegExp(/(["'`]).*?\1/g);

		let result;

		while ((result = matchString.exec(line)) !== null) {
			const start = result.index + 1;
			const end = result.index + result[0].length - 1;

			// Early out if selection covers the found string
			if (range._start._character < start && range._end._character > end) {
				return false;
			}

			if (range._start._character <= end && range._start._character >= start) {
				return document.getText(new vscode.Range(
					new vscode.Position(range._start._line, start),
					new vscode.Position(range._start._line, end)
				));
			}
		}

		return false;
	}
	/**
		 * Searches for a character backwards inside fullText discarding spaces, tabs and newlines
		 * Returns the found index-1 or false if any other character is found.
		 * The purpose of this function is finding the position of the last character that is not
		 * the given character excluding newline/spaces. For example when finding the parent of a
		 * property.
		 * @param {String} fullText String to process
		 * @param {Number} offset offset at which we start the search from
		 * @param {String} searchFor a single character to search for
		 * @returns {Boolean|Integer} Returns offset or false
		 */
	doBackwardsSearch (fullText, offset, searchFor) {
		let currentChar;
		let found = false;
		let whileOffset = offset;

		// Do backwards search
		do {
			currentChar = fullText[whileOffset];
			if (currentChar === searchFor) {
				found = true;
			}
			whileOffset--;
			if (found) {
				return whileOffset;
			}
		} while (
			whileOffset >= 0
			&& (currentChar === ' ' || currentChar === '\t' || currentChar === '\n' || currentChar === '\r')
		);

		return false;
	}

	findCurrentDefineRange (requireOrDefineStatements, caretPosition) {
		let foundSection = null;

		for (let i = 0; i < requireOrDefineStatements.length; i++) {
			if (caretPosition >= requireOrDefineStatements[i].start
								&& (!requireOrDefineStatements[i].end || caretPosition <= requireOrDefineStatements[i].end)) {
				foundSection = requireOrDefineStatements[i];
			}
		}

		return foundSection;
	}

	checkIfCommentedOut (commentRanges, position) {
		for (let i = 0; i < commentRanges.length; i++) {
			if (position >= commentRanges[i].start && position <= commentRanges[i].end) {
				return true;
			}
		}

		return false;
	}

	provideDefinition (document, position) {
		const fullText = document.getText();
		const currentFilePath = document.fileName;
		const range = document.getWordRangeAtPosition(position);

		let moduleList, requireOrDefineStatements;
		let foundSection = null;

		if (range) {
			const textAtCaret = document.getText(range);
			const caretPosition = document.offsetAt(range._start);
			const commentRanges = this.findComments(fullText);

			requireOrDefineStatements = this.getRequireOrDefineStatements(fullText);

			if (requireOrDefineStatements.length) {
				foundSection = this.findCurrentDefineRange(requireOrDefineStatements, caretPosition);
				if (foundSection && !this.checkIfCommentedOut(commentRanges, foundSection.start)) {
					moduleList = this.getModulesWithPathFromRequireOrDefine(foundSection.contents);
				}
			}

			let modulePath;

			modulePath = moduleList ? moduleList[textAtCaret] : null;

			// We matched a module (textAtCaret is a module)
			if (modulePath) {
				let searchFor = '';
				let stopSearchingFurther;

				if (ReferenceProvider.childWord === '') { // Not a parent - search for the module name (word)
					searchFor = textAtCaret;
					stopSearchingFurther = true;
				} else { // It is a parent, search for the child which is a property of the module
					searchFor = ReferenceProvider.childWord;
					stopSearchingFurther = false;
				}
				ReferenceProvider.childWord = '';

				return this.searchModule(currentFilePath, modulePath, searchFor, stopSearchingFurther);
			}	// word is not a module

			return new Promise(resolve => {
				let continueFrom, tmpModuleName;

				let dotPosition = range._start._character >= 1
					? document.offsetAt(new vscode.Position(range._start._line, range._start._character - 1))
					: 0;

				// Do backwards search for a dot
				dotPosition = this.doBackwardsSearch(fullText, dotPosition, '.');
				const haveParent = dotPosition !== false;

				if (!haveParent) {
					tmpModuleName = this.extractString(document, range);
				}

				let offsetStart = foundSection ? foundSection.start : 0;
				let offsetEnd = foundSection ? foundSection.end : Infinity;
				const constructors = this.findConstructor(document, textAtCaret, fullText, offsetStart, offsetEnd);
				// TODO: also consider window. defined globals
				// Dont have a parent and have a constructor, follow the constructor

				let requireModuleSupport = vscode.workspace.getConfiguration('requireModuleSupport');
				let requireName = requireModuleSupport.get('requireName') || 'require';

				if (constructors.length && !haveParent) {
					let constructorName = document.getText(document.getWordRangeAtPosition(constructors[0].range._start));
					// Break search in case the instance and the constructor have the same name

					if (constructorName === textAtCaret
						|| constructorName === ReferenceProvider.childWord) {
						resolve(undefined);

						return;
					} else if (constructorName === requireName) { // Module is used commonJS style - instead of complicating module list extraction, directly navigate
						let re = new RegExp(`(${requireName})s*\\(s*(['"]*)`, 'gi');

						re.lastIndex = document.offsetAt(constructors[0].range._start);
						let stringOffset = re.exec(fullText)[0].length;
						const lineStart = constructors[0].range._start._line;
						const startCharacter = constructors[0].range._start._character;

						const string = this.extractString(document, new vscode.Range(
							new vscode.Position(lineStart, startCharacter + stringOffset),
							new vscode.Position(lineStart, startCharacter + stringOffset)
						));

						this.searchModule(currentFilePath, string, ReferenceProvider.childWord, true).then(refs => {
							resolve([refs]);
						});
					} else {
						continueFrom = constructors[0].range._start;
					}
				} else if (haveParent) { // Have a parent - follow it
					const propertyParentPosition = document.positionAt(dotPosition);
					let bracketPosition = document.offsetAt(propertyParentPosition);

					// Do backwards search for a ")"
					bracketPosition = this.doBackwardsSearch(fullText, bracketPosition, ')');

					// Immediately invoked define/require
					if (bracketPosition !== false) {
						const line = document.lineAt(propertyParentPosition._line).text;
						const modulePathFromLine = /['"]([^'"]*)/gi.exec(line);

						if (modulePathFromLine.length === 0) {
							resolve(undefined);

							return;
						}

						this.searchModule(currentFilePath, modulePathFromLine[1], textAtCaret, true).then(refs => {
							resolve([refs]);
						});
					} else {
						continueFrom = propertyParentPosition;
						ReferenceProvider.childWord = textAtCaret;
					}
				} else { // Neither have a parent nor a constructor, maybe its a module itself? navigate to module
					let isModule = false;

					for (let key in moduleList) {
						if (moduleList[key] === tmpModuleName) {
							isModule = true;
							break;
						}
					}

					if (isModule) {
						this.searchModule(currentFilePath, tmpModuleName, '', true).then(refs => {
							resolve([refs]);
						});
					} else {
						// No match;
						resolve(undefined);

						return;
					}
				}

				// Should we continue searching? If so re-invoke a definition provider
				if (continueFrom) {
					vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, continueFrom).then(refs => {
						for (let i = refs.length - 1; i >= 0; i--) {
							// Discard if same file
							if (refs[i].uri.fsPath === document.uri.fsPath) {
								refs.splice(i, 1);
							}
						}
						resolve(refs);
					});
				}
			});
		}
		// No range;
		return undefined;
	}
}

ReferenceProvider.childWord = '';

module.exports = ReferenceProvider;
