import React, { useEffect, useReducer, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import _ from "lodash";
import { GetServerSideProps, GetStaticProps } from "next";

const title = "Simple JSON CMS";

const defaultJson = {
  example: "This is just some example JSON",
  tip: "Click “Show text editor” above to paste your own JSON",
  items: ["It can", "be", "arrays"],
  numbers: [1, 2, 3],
  object: { foo: "bar" },
};

const isProd = process.env.NODE_ENV === "production";
const baseUrl = isProd ? "https://simplejsoncms.com" : "http://localhost:3001";

type State = {
  showText: boolean;
  password: string;
  saving: boolean;
  error?: string;
};

export default function Editor(props: any) {
  const [state, setState] = useReducer(
    (s: State, u: Partial<State>) => ({ ...s, ...u }),
    {
      showText: false,
      password: "",
      saving: false,
    }
  );

  const editorRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const JSONEditor = require("jsoneditor");
    const container = document.getElementById("jsoneditor");
    const textContainer = document.getElementById("texteditor");
    if (!container) {
      return console.log("NO DIV");
    }
    const onChangeJson = (json: any) => {
      if (typeof json === "string") {
        try {
          editor.set(JSON.parse(json));
        } catch (e) {
          console.warn("Invalid json");
          return;
        }
      } else {
        textEditor.set(json);
      }
    };
    const { json } = props;
    const options = {
      onChangeJSON: onChangeJson,
    };
    const editor = new JSONEditor(container, options);
    editor.set(json);

    const textOptions = {
      mode: "code",
      indentation: 2,
      onChangeText: onChangeJson,
    };
    const textEditor = new JSONEditor(textContainer, textOptions);
    textEditor.set(json);

    editorRef.current = editor;
  }, []);

  // componentWillReceiveProps(nextProps) {
  //   const { json } = nextProps;
  //   const { json: oldJson } = props;
  //   if (!_.isEqual(json, oldJson)) {
  //     editor.set(json);
  //     textEditor.set(json);
  //   }
  //   if (props.id !== nextProps.id) {
  //     setState({
  //       showText: false,
  //       password: ""
  //     });
  //   }
  // }

  const onSave = async () => {
    const { id } = props;
    const { password } = state;
    const json = editorRef.current.get();
    let error;
    setState({ saving: true });
    const result = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ id, json, password }),
    }).then((r) => r.json());
    if (result && result.error) {
      error = result.error;
    } else if (result && result.id) {
      router.replace("/" + result.id);
    }
    setState({ saving: false, error });
  };

  const { showText, saving, error, password } = state;
  const { id, secured, isRoot } = props;
  console.log({ id }, "asd");
  const apiUrl = id && baseUrl + "/api/" + id;
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
        onClick={onSave}
        style={{ marginRight: 10 }}
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <button
        className="btn"
        style={{ marginRight: 10 }}
        onClick={() => setState({ showText: !showText })}
      >
        {showText ? "Hide" : "Show"} text editor
      </button>
      {(id || isRoot) && (
        <Link href="/" className="btn btn-primary">
          New document
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
            onChange={(e) => setState({ password: e.target.value })}
          />
        </div>
      )}
      <div
        style={{
          maxWidth: 800,
          margin: "auto",
          marginTop: 40,
          display: showText ? "block" : "none",
        }}
        id="texteditor"
      />
      <div
        style={{ maxWidth: 800, margin: "auto", marginTop: 20 }}
        id="jsoneditor"
      />
      <p style={{ marginTop: 60 }}>
        Built by <a href="https://jenshandersson.com">Jens Andersson</a>. Using{" "}
        <a href="https://github.com/josdejong/jsoneditor">jsoneditor</a>
      </p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id ? params.id[0] : null;
  let json = {};
  let secured = false;
  const isRoot = !id;
  if (isRoot) {
    json = defaultJson;
  }

  console.log({ id });
  if (id) {
    const res = await fetch(baseUrl + "/api/" + id);
    json = await res.json();
    if (res.headers.get("x-protected")) {
      secured = true;
    }
  }
  return { props: { id, json, secured, isRoot } };
};
