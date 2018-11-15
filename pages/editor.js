import React from "react";
import Router from "next/router";
import Link from "next/link";
import fetch from "isomorphic-unfetch";
import Head from "next/head";
import _ from "lodash/core";
import "../styles.scss";
import "../editor.css";

const title = "Simple JSON CMS";

const defaultJson = {
  example: "This is just some example JSON",
  tip: "Click “Show text editor” above to paste your own JSON",
  items: ["It can", "be", "arrays"],
  numbers: [1, 2, 3],
  object: { foo: "bar" }
};

const isProd = process.env.NODE_ENV === "production";
const baseUrl = isProd
  ? "https://simplejsoncms.com/"
  : "http://localhost:2000/";

Router.onRouteChangeComplete = url => {
  setTimeout(() => {
    window.gtag("config", "UA-43929520-5", {
      page_location: url
    });
  }, 50);
};

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeJson = this.onChangeJson.bind(this);
    this.onSave = this.onSave.bind(this);
    this.state = {
      showText: false,
      password: ""
    };
  }

  static async getInitialProps({ asPath, query }) {
    const { id } = query;
    let json = {};
    let secured = false;
    const isRoot = asPath === "/";
    if (isRoot) {
      json = defaultJson;
    }
    if (id) {
      const res = await fetch(baseUrl + "api/" + id, {
        headers: {
          "x-skip-incr": true
        }
      });
      json = await res.json();
      if (res.headers.get("x-protected")) {
        secured = true;
      }
    }
    return { id, json, secured, isRoot };
  }

  componentDidMount() {
    const container = document.getElementById("jsoneditor");
    const textContainer = document.getElementById("texteditor");
    if (!container) {
      return console.log("NO DIV");
    }
    const { json } = this.props;
    const JSONEditor = require("jsoneditor");
    const options = {
      onChangeJSON: this.onChangeJson
    };
    this.editor = new JSONEditor(container, options);
    this.editor.set(json);

    const textOptions = {
      mode: "code",
      indentation: 2,
      onChangeText: this.onChangeJson
    };
    this.textEditor = new JSONEditor(textContainer, textOptions);
    this.textEditor.set(json);
  }

  componentWillReceiveProps(nextProps) {
    const { json } = nextProps;
    const { json: oldJson } = this.props;
    if (!_.isEqual(json, oldJson)) {
      this.editor.set(json);
      this.textEditor.set(json);
    }
    if (this.props.id !== nextProps.id) {
      this.setState({
        showText: false,
        password: ""
      });
    }
  }

  onChangeJson(json) {
    if (typeof json === "string") {
      try {
        this.editor.set(JSON.parse(json));
      } catch (e) {
        console.warn("Invalid json");
        return;
      }
    } else {
      this.textEditor.set(json);
    }
  }

  async onSave() {
    const { id } = this.props;
    const { password } = this.state;
    const json = this.editor.get();
    let error;
    this.setState({ saving: true });
    const result = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ id, json, password })
    }).then(r => r.json());
    if (result && result.error) {
      error = result.error;
    } else if (result && result.id) {
      Router.replace(`/editor?id=${result.id}`, "/editor/" + result.id);
    }
    this.setState({ saving: false, error });
  }

  render() {
    const { showText, saving, error, password } = this.state;
    const { id, secured, isRoot } = this.props;
    const apiUrl = id && baseUrl + "api/" + id;
    return (
      <div>
        <Head>
          <title>{title}</title>
          <meta key="og:title" property="og:title" content={title} />
        </Head>
        <h1>Super Simple JSON CMS</h1>
        {apiUrl && (
          <div style={{ margin: 20 }}>
            Your API:{" "}
            <a target="_blank" href={apiUrl}>
              {apiUrl}
            </a>
          </div>
        )}
        {isRoot ? (
          <div style={{ marginBottom: 40 }}>
            <p className="lead">
              Online JSON editor for non-devs, automatically exposed through our
              speedy API. Perfect for your simple site/app when you need the
              client to make changes (but don't need a full-fledged CMS like
              wordpress, squarespace etc).
            </p>
            Example API:{" "}
            <a target="_blank" href="https://simplejsoncms.com/api/example">
              https://simplejsoncms.com/api/example
            </a>
          </div>
        ) : (
          <div style={{ marginBottom: 40 }}>
            <p className="lead">
              Create your own JSON document and API below. Copy/paste in your
              exising JSON document or use the editor from scratch. Press Save
              when ready to publish.
            </p>
          </div>
        )}
        <button
          className="btn btn-success"
          onClick={this.onSave}
          style={{ marginRight: 10 }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          className="btn"
          style={{ marginRight: 10 }}
          onClick={() => this.setState({ showText: !showText })}
        >
          {showText ? "Hide" : "Show"} text editor
        </button>
        {(id || isRoot) && (
          <Link href="/editor">
            <a className="btn btn-primary">New document</a>
          </Link>
        )}
        {error && (
          <div>
            <p style={{ color: "tomato", fontWeight: "bold", margin: 20 }}>
              {error}
            </p>
          </div>
        )}
        {id && (
          <div style={{ margin: 20 }}>
            {secured ? "Password protected" : "Add a password"}:{" "}
            <input
              type="password"
              value={password}
              onChange={e => this.setState({ password: e.target.value })}
            />
          </div>
        )}
        <div
          style={{
            maxWidth: 800,
            margin: "auto",
            marginTop: 40,
            display: showText ? "block" : "none"
          }}
          id="texteditor"
        />
        <div
          style={{ maxWidth: 800, margin: "auto", marginTop: 20 }}
          id="jsoneditor"
        />
        <p style={{ marginTop: 60 }}>
          Built by <a href="https://jenshandersson.com">Jens Andersson</a>.
          Using <a href="https://github.com/josdejong/jsoneditor">jsoneditor</a>
        </p>
      </div>
    );
  }
}
