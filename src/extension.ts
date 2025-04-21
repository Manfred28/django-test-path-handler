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

	context.subscriptions.push(copyPathAsDotNotation, copyWithPrefixSuffix);
}

function convertAndCopyPath(usePrefixSuffix: boolean) {
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

// This method is called when your extension is deactivated
export function deactivate() {}
