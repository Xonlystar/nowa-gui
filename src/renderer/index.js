import dva from 'dva';
import { ipcRenderer, remote } from 'electron';
import Message from 'antd/lib/message';

import RouterConfig from './router';
import project from './models/project';
import layout from './models/layout';
import task from './models/task';
import init from './models/init';
// import semverDiff from 'semver-diff';
// import semver from 'semver';

import { IS_WIN } from './constants';

import 'antd/dist/antd.min.css';
import '../assets/styles/base.css';
import '../assets/styles/site.less';

if (IS_WIN) {
  import('../assets/styles/is-win.less');
} else {
  import('../assets/styles/is-mac.less');
}

/*console.log(semverDiff('0.0.1', '0.0.1-foo'))
console.log(semver.gt('0.0.1', '0.0.1-foo'))
console.log(semver.lt('0.1.0', '0.1.0-beta'))
console.log(semver.gt('0.1.0', '0.1.0-beta'))
*/
window.AliMonitor = window.AliMonitor || [];

remote.require('getmac').getMac((err, macAddress) => {
    if (err) Message.error(err, 3);
    AliMonitor.push({
      url: 'log://uxdata/nowa/',
      msg: `{"MAC": ${macAddress}}`
    });
});


ipcRenderer.on('MAIN_ERR', (event, msg) => {
  Message.error(msg, /* duration */3);
});


// 1. Initialize
const app = dva({
  onError(e) {
    Message.error(e.stack, /* duration */3);
  },
});

// 2. Plugins

// 3. Model

app.model(project);
app.model(layout);
app.model(task);
app.model(init);

// 4. Router
app.router(RouterConfig);

// 5. Start
app.start('#root');
