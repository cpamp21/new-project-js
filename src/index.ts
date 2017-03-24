import { Input } from './Input/Input';
import * as color from 'colorful-text';
import { GitInit } from './Processes/GitInit';
import { GitRemote } from './Processes/GitRemote';
import { NpmInit } from './Processes/NpmInit';
import { NpmInstall } from './Processes/NpmInstall';
import { TscInit } from './Processes/TscInit';
import { FileWriter } from './Files/FileWriter';
import { GitAdd } from './Processes/GitAdd';
import { GitCommit } from './Processes/GitCommit';

var repository: string = '';
var typescript: boolean = false;
Input.request('Enter a git repository: ').then((repo: string) => {
    repository = repo;
    return Input.request('Is this a Typescript project? (yes) ');
}).then((ts: string) => {
    typescript = /^.*[Yy].*$/.test(ts);
}).then(() => {
    return new GitInit().start();
}).then(() => {
    if (!/^ *$/.test(repository)) {
        return new GitRemote(repository).start();
    }
}).then(() => {
    var npmInit = new NpmInit();
    var p = npmInit.start();
    npmInit.onOutput((data: Buffer) => {
        var str: string = data.toString();
        if (str.indexOf('Is this ok?') !== -1) {
            npmInit.$process.stdin.end();
        }
    });
    return p;
}).then(() => {
    if (typescript) {
        return new NpmInstall('typescript').start().then(() => {
            return new NpmInstall('@types/node', true).start();
        });
    }
}).then(() => {
    return new TscInit().start();
}).then(() => {
    return FileWriter.createGitIgnore();
}).then(() => {
    return new GitAdd().start();
}).then(() => {
    return new GitCommit('Initial Commit').start();
}).catch((err) => {
    console.log(color.fg.red('There was an error: '));
    console.log(err);
}).then(() => {
    return Input.request('Press any key to continue...');
}).then(() => {
    process.exit();
});