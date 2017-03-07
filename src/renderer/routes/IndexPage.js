import React, { Component, PropTypes } from 'react';
import { remote, shell } from 'electron';
import Dropzone from 'react-dropzone';
import { connect } from 'dva';
import Layout from 'antd/lib/layout';
import { info, confirm } from 'antd/lib/modal';
import i18n from 'i18n';
import semverDiff from 'semver-diff';
import semver from 'semver';

import WelcomePage from './WelcomePage';
import DragPage from './DragPage';
import MainPage from './MainPage';
import request from '../services/request';
import { hidePathString } from '../util';
import { IS_WIN, UPGRADE_URL } from '../constants';
import { getLocalUpdateFlag, setLocalUpdateFlag, getLocalLanguage } from '../services/localStorage';

const { Header } = Layout;
const { win } = remote.getGlobal('services');



class IndexPage extends Component {
  constructor(props) {
    super(props);
    this.onDrop = this.onDrop.bind(this);
  }
  componentDidMount() {
    // upgrade.checkLatest();
    const { dispatch, version } = this.props;
    request('https://registry.npm.taobao.org/nowa-gui-version/latest')
      .then(({ data }) => {
        const newVersion = data.version;
        console.log(newVersion);

        if (semver.lt(version, newVersion)) {
          dispatch({
            type: 'layout/changeStatus',
            payload: { newVersion }
          });
        }

        if (+getLocalUpdateFlag() !== 1) {
          const arr = data.readme.split('#').filter(i => !!i).map(i => i.split('*').slice(1));

          const tip = getLocalLanguage() === 'zh' ? arr[0] : arr[1];

          info({
            title: i18n('msg.updateTip'),
            content: (
              <ul className="update-tip">
                {tip.map(item => <li key={item}>{item}</li>)}
              </ul>),
            onOk() {
              setLocalUpdateFlag();
            },
            okText: i18n('form.ok'),
          });
        }
      });
  }

  componentWillReceiveProps(next) {
    if (next.newVersion !== this.props.newVersion) {
      confirm({
        title: i18n('msg.updateConfirm'),
        content: (
          <div>
            <p>{i18n('msg.curVersion')} {this.props.newVersion}</p>
            <p>{i18n('msg.nextVersion')} {next.newVersion}</p>
          </div>),
        onOk() {
          shell.openExternal(UPGRADE_URL);
        },
        onCancel() {},
        okText: i18n('form.ok'),
        cancelText: i18n('form.cancel'),
      });
    }
  }

  onDrop(acceptedFiles) {
    const { dispatch } = this.props;

    dispatch({
      type: 'project/importProj',
      payload: { filePath: acceptedFiles[0].path }
    });
    this.onDragLeave();
  }

  onDragOver() {
    document.getElementById('main-ctn').style.display = 'none';
    document.getElementById('drag-ctn').style.display = '';
  }

  onDragLeave() {
    document.getElementById('main-ctn').style.display = '';
    document.getElementById('drag-ctn').style.display = 'none';
  }

  render() {
    const { showPage, dispatch, version, current } = this.props;

    const closeBtn = <div className="icn icn-x" key="0" onClick={() => win.close()}>
      <i className="iconfont icon-x" /></div>;
    const minimizeBtn = <div className="icn icn-min" key="1" onClick={() => win.minimize()}>
      <i className="iconfont icon-msnui-minimize" /></div>;
    const maximizeBtn = <div className="icn icn-max" key="2">
      <i className="iconfont icon-msnui-maximize" /></div>;


    const mainbody = showPage
      ? <MainPage showPage={showPage} dispatch={dispatch} />
      : <WelcomePage version={version} dispatch={dispatch} />;

    return (
      <Dropzone className="container"
        onDrop={this.onDrop}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onClick={e => e.preventDefault()}
      >
        <Layout className="ui-layout" id="main-ctn">
          <Header className="top-bar">
            { showPage > 0 && <div className="bar-bd" /> }
            <div className="logo" onClick={() => shell.openExternal('https://nowa-webpack.github.io/')} />
            { showPage === 2 && <div className="proj-path">
              {current.name}
              <span>({hidePathString((current.path || ''))})</span>
            </div>}

            <div className="app-opt">
              { IS_WIN ? [closeBtn, maximizeBtn, minimizeBtn] : [closeBtn, minimizeBtn, maximizeBtn]}
            </div>
          </Header>
          { mainbody }
        </Layout>
        <DragPage />
      </Dropzone>
    );
  }
}

IndexPage.propTypes = {
  version: PropTypes.string.isRequired,
  newVersion: PropTypes.string.isRequired,
  showPage: PropTypes.number.isRequired,
  current: PropTypes.shape({
    name: PropTypes.string,
    path: PropTypes.string
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default connect(({ layout, project }) => ({
  showPage: layout.showPage,
  newVersion: layout.newVersion,
  version: layout.version,
  current: project.current 
}))(IndexPage);
