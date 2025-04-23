// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "django-test-path-handler" is now active!');

	const copyPathAsDotNotation = vscode.commands.registerCommand('djangoPathHandler.copyPathAsDotNotation', () => {
		convertAndCopyPath(false);
	});

	const copyWithPrefixSuffix = vscode.commands.registerCommand('djangoPathHandler.copyWithPrefixSuffix', () => {
		convertAndCopyPath(true);
	});

	const copyWithSelectedMethod = vscode.commands.registerCommand('djangoPathHandler.copyWithSelectedMethod', () => {
		convertAndCopyPath(true, true);
	});

	context.subscriptions.push(copyPathAsDotNotation, copyWithPrefixSuffix, copyWithSelectedMethod);
}

async function convertAndCopyPath(usePrefixSuffix: boolean, includeSelectedMethod: boolean = false) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor found');
		return;
	}

	const document = editor.document;
	const filePath = document.uri.fsPath;
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
	
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('File not in workspace');
		return;
	}

	let relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
	
	const config = vscode.workspace.getConfiguration('djangoPathHandler');
	const trimFolders = config.get<number>('trimFolders') || 0;
	
	const pathParts = relativePath.split(path.sep);
	
	const fileExtension = path.extname(relativePath);
	const fileNameIndex = pathParts.length - 1;
	
	if (fileExtension) {
		pathParts[fileNameIndex] = pathParts[fileNameIndex].slice(0, -fileExtension.length);
	}
	
	if (trimFolders > 0 && pathParts.length > trimFolders) {
		pathParts.splice(0, trimFolders);
	}
	
	let dotPath = pathParts.join('.');
	
	// If we need to include the selected method
	if (includeSelectedMethod && document.languageId === 'python') {
		const selectedMethod = await extractPythonMethod(document, editor.selection);
		if (selectedMethod) {
			dotPath = `${dotPath}.${selectedMethod}`;
		}
	}
	
	if (usePrefixSuffix) {
		const prefix = config.get<string>('prefix') || '';
		const suffix = config.get<string>('suffix') || '';
		
		let result = '';
		
		if (prefix) {
			result += prefix;
			if (!prefix.endsWith(' ')) {
				result += ' ';
			}
		}
		
		result += dotPath;
		
		if (suffix) {
			if (!suffix.startsWith(' ')) {
				result += ' ';
			}
			result += suffix;
		}
		
		dotPath = result;
	}
	
	vscode.env.clipboard.writeText(dotPath).then(() => {
		vscode.window.showInformationMessage(`Copied to clipboard: ${dotPath}`);
	});
}

async function extractPythonMethod(document: vscode.TextDocument, selection: vscode.Selection): Promise<string | null> {
	// If there's a selection, use it directly
	if (!selection.isEmpty) {
		return document.getText(selection);
	}
	
	// If no text is selected, try to extract the current method and class
	const position = selection.active;
	const lineText = document.lineAt(position.line).text;
	
	// Check if cursor is on a method definition
	const methodMatch = lineText.match(/\s*def\s+([a-zA-Z0-9_]+)\s*\(/);
	if (methodMatch) {
		const methodName = methodMatch[1];
		const classInfo = await findContainingClass(document, position.line);
		
		if (classInfo) {
			return `${classInfo}.${methodName}`;
		}
		return methodName;
	}
	
	// Check surrounding context for method
	return findMethodFromContext(document, position.line);
}

async function findContainingClass(document: vscode.TextDocument, currentLine: number): Promise<string | null> {
	let lineIndex = currentLine;
	
	// Search upward for class definition
	while (lineIndex >= 0) {
		const line = document.lineAt(lineIndex).text;
		const classMatch = line.match(/\s*class\s+([a-zA-Z0-9_]+)[\s:(]/);
		
		if (classMatch) {
			return classMatch[1];
		}
		
		lineIndex--;
	}
	
	return null;
}

async function findMethodFromContext(document: vscode.TextDocument, currentLine: number): Promise<string | null> {
	// Look for method in current function first
	let lineIndex = currentLine;
	const maxLinesLookup = 30; // Don't scan too many lines
	let scanCount = 0;
	
	// First, look upward for a method definition
	while (lineIndex >= 0 && scanCount < maxLinesLookup) {
		const line = document.lineAt(lineIndex).text;
		const methodMatch = line.match(/\s*def\s+([a-zA-Z0-9_]+)\s*\(/);
		
		if (methodMatch) {
			const methodName = methodMatch[1];
			const classInfo = await findContainingClass(document, lineIndex);
			
			if (classInfo) {
				return `${classInfo}.${methodName}`;
			}
			return methodName;
		}
		
		lineIndex--;
		scanCount++;
	}
	
	// If no method found, look for class
	const classInfo = await findContainingClass(document, currentLine);
	return classInfo || null;
}

// This method is called when your extension is deactivated
export function deactivate() {}
