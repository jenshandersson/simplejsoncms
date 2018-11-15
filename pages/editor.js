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

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeJson = this.onChangeJson.bind(this);
    this.onSave = this.onSave.bind(this);
    this.state = {
      showText: false
    };
  }

  static async getInitialProps({ asPath, query }) {
    const { id } = query;
    let json = defaultJson;
    if (asPath === "/editor") {
      json = {};
    }
    if (id) {
      const res = await fetch(baseUrl + "api/" + id);
      json = await res.json();
    }
    return { id, json };
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
    const json = this.editor.get();
    this.setState({ saving: true });
    const result = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ id, json })
    }).then(r => r.json());
    if (result && result.id) {
      Router.replace(`/editor?id=${result.id}`, "/editor/" + result.id);
    }
    this.setState({ saving: false });
  }

  render() {
    const { showText, saving, error } = this.state;
    const { id } = this.props;
    const apiUrl = id && baseUrl + "api/" + id;
    return (
      <div>
        <Head>
          <title>{title}</title>
          <meta key="og:title" property="og:title" content={title} />
        </Head>
        <h1>Super Simple JSON CMS</h1>
        {apiUrl ? (
          <div style={{ margin: 20 }}>
            Your API:{" "}
            <a target="_blank" href={apiUrl}>
              {apiUrl}
            </a>
          </div>
        ) : (
          <div>
            <p className="lead" style={{ marginBottom: 60 }}>
              Online JSON editor for non-devs, automatically exposed through our
              speedy API. Perfect for your simple site/app when you need the
              client to make changes (but don't need a full-fledged CMS like
              wordpress, squarespace etc).
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
        <Link href="/editor">
          <a className="btn btn-primary" style={{ marginRight: 10 }}>
            New
          </a>
        </Link>
        <button
          className="btn"
          onClick={() => this.setState({ showText: !showText })}
        >
          {showText ? "Hide" : "Show"} text editor
        </button>
        {error && (
          <div>
            <p style={{ color: "tomato", fontWeight: "bold" }}>{error}</p>
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
      </div>
    );
  }
}
