import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as fs from 'fs';
import { after, before } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite('Django Path Handler Extension Tests', () => {
	const testFilePath = path.join(__dirname, 'fixtures', 'test_folder', 'tests', 'test_file.py');
	let clipboardStub: sinon.SinonStub;
	let showInfoStub: sinon.SinonStub;
	let getConfigStub: sinon.SinonStub;
	let workspaceFolderStub: sinon.SinonStub;
	let testFileUri: vscode.Uri;

	before(async () => {
		// Create test file structure if it doesn't exist
		const fixturesDir = path.join(__dirname, 'fixtures');
		const testFolderDir = path.join(fixturesDir, 'test_folder');
		const testsDir = path.join(testFolderDir, 'tests');
		
		if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir);
		if (!fs.existsSync(testFolderDir)) fs.mkdirSync(testFolderDir);
		if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir);
		
		if (!fs.existsSync(testFilePath)) {
			fs.writeFileSync(testFilePath, '# Test file for Django Path Handler');
		}
		
		// Create URI for test file
		testFileUri = vscode.Uri.file(testFilePath);
		
		// Activate extension
		await vscode.extensions.getExtension('django-test-path-handler')?.activate();
	});

	beforeEach(() => {
		// Stub clipboard writeText method
		clipboardStub = sinon.stub(vscode.env.clipboard, 'writeText').resolves();
		
		// Stub showInformationMessage
		showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
		
		// Mock workspace folder
		workspaceFolderStub = sinon.stub(vscode.workspace, 'getWorkspaceFolder');
		workspaceFolderStub.returns({ uri: vscode.Uri.file(path.join(__dirname, 'fixtures')) } as vscode.WorkspaceFolder);
		
		// Mock config
		getConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return '';
					case 'suffix': return '';
					case 'trimFolders': return 0;
					default: return undefined;
				}
			}
		} as any);
	});

	afterEach(() => {
		clipboardStub.restore();
		showInfoStub.restore();
		getConfigStub.restore();
		workspaceFolderStub.restore();
	});

	test('Copy Path as Dot Notation - Basic Functionality', async () => {
		// Mock the active editor
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: testFileUri
				}
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyPathAsDotNotation');
		
		// Verify clipboard was called with the correct path
		sinon.assert.calledWith(clipboardStub, 'test_folder.tests.test_file');
		
		docStub.restore();
	});

	test('Copy Path with Prefix/Suffix', async () => {
		// Update mock config to include prefix and suffix
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return 'python manage.py test';
					case 'suffix': return '--keepdb';
					case 'trimFolders': return 0;
					default: return undefined;
				}
			}
		} as any);

		// Mock the active editor
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: testFileUri
				}
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyWithPrefixSuffix');
		
		// Verify clipboard was called with the correct path
		sinon.assert.calledWith(clipboardStub, 'python manage.py test test_folder.tests.test_file --keepdb');
		
		docStub.restore();
	});

	test('Path with trimFolders setting', async () => {
		// Update mock config to trim the first folder
		getConfigStub.returns({
			get: (key: string) => {
				switch (key) {
					case 'prefix': return '';
					case 'suffix': return '';
					case 'trimFolders': return 1;
					default: return undefined;
				}
			}
		} as any);

		// Mock the active editor
		const docStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => {
			return {
				document: {
					uri: testFileUri
				}
			} as any;
		});

		// Execute command
		await vscode.commands.executeCommand('djangoPathHandler.copyPathAsDotNotation');
		
		// Verify clipboard was called with the correct trimmed path
		sinon.assert.calledWith(clipboardStub, 'tests.test_file');
		
		docStub.restore();
	});
});
