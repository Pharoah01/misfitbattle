/**
 * Monaco Editor Configuration
 * 
 * Configures @monaco-editor/react to use the locally bundled monaco-editor
 * instead of loading from jsDelivr CDN. This avoids CSP issues in production
 * and ensures the editor works without external network dependencies.
 */

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco environment to use local workers
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

// Tell the loader to use the local monaco-editor package (skip CDN entirely)
loader.config({ monaco });
