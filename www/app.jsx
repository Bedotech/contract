import React, { useEffect, useState } from "react";
import * as wasm from "minijinja-playground";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-nunjucks";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/keybinding-vim";

wasm.set_panic_hook();

const FONT_SIZE = 13;
const TAB_SIZE = 2;
const KEYBOARD_HANDLER = undefined;
const DEFAULT_CONTEXT = {
  customer: {
    name: "ACME S.R.L.",
    municipality: "Milano",
    address: "Via Roma 1",
    vat_numer: "01234567890",
    legal_person_fullname: "Mario Rossi",
    legal_person_vat_number: "RSSMRA80A01H501Z",
  },
  supplier: {
    name: "Fornitore S.R.L.",
    municipality: "Torino",
    address: "Via Milano 2",
    vat_numer: "09876543210",
    legal_person_fullname: "Giuseppe Verdi",
    legal_person_vat_number: "VRDGPP80A01H501Z",
  },
};

const DEFAULT_INJECT = `\
<link rel="stylesheet" href="/style.css" crossorigin="anonymous">
<script src="/selection.js"></script>
`;

const DEFAULT_TEMPLATE = `\
<h2>CONTRATTO DI GESTIONE E MANUTENZIONE
DI IMPIANTI DI ACCUMULO STAND ALONE</h2>

<p>tra</p>
<p>{{ customer.name }}, con sede legale in {{ customer.municipality }}, {{ customer.address }} , C.F. e P.I.  {{ customer.vat_numer }}, in persona del legale rappresentante {{ customer.legal_person_fullname }}, cod. fis. {{ customer.legal_person_vat_number }} (di seguito “Committente”)</p>
<p>e</p>
<p>{{ supplier.name }}, con sede legale in {{ supplier.municipality }}, {{ supplier.address }} , C.F. e P.I.  {{ supplier.vat_numer }}, in persona del legale rappresentante {{ supplier.legal_person_fullname }}, cod. fis. {{ supplier.legal_person_vat_number }} (di seguito Fornitore)</p>
<p>Di seguito congiuntamente le “Parti” e singolarmente la “Parte”</p>

<h2>PREMESSE</h2>
<p>La Committente è proprietaria dell’impianto [●] sito nel Comune di [●] (di seguito l’”Impianto”), costituito da [●]/meglio identificato nell’Allegato B.</p>
<ul>
{% for i in range(1, 5) %}
    <li> {{ i }}. {{ customer.name }} </li>
{% endfor %}
</ul>
`;

function getSetting(key, defaultValue) {
  if (!localStorage) {
    return defaultValue;
  }
  const setting = localStorage.getItem("minijinja-playground:" + key);
  if (setting === null) {
    return defaultValue;
  } else {
    return JSON.parse(setting);
  }
}

function setSetting(key, value) {
  if (localStorage) {
    try {
      localStorage.setItem(
        "minijinja-playground:" + key,
        JSON.stringify(value)
      );
    } catch (err) {}
  }
}

const Editor = ({
  template,
  templateContext,
  mode,
  pyCompat,
  onTemplateChange,
  onTemplateContextChange,
  onTemplateSelection,
  onSetPyCompat,
  outputHeight,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [mouseBase, setMouseBase] = useState(0);
  const [width, setWidth] = useState(() => getSetting("contextWidth", 350));
  const [widthBase, setWidthBase] = useState(0);

  return (
    <div
      style={{ display: "flex", height: `calc(100vh - ${outputHeight}px)` }}
      onMouseMove={(e) => {
        if (isDragging) {
          const newWidth = widthBase - (e.pageX - mouseBase);
          setWidth(newWidth);
          setSetting("contextWidth", 350);
        }
      }}
      onMouseUp={(e) => {
        setIsDragging(false);
        setMouseBase(0);
        setWidthBase(0);
      }}
    >
      <div style={{ flex: "1", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "10px",
            zIndex: 1000,
            display: "flex",
            gap: "8px"
          }}
        >
          <select
            value={pyCompat ? "pycompat" : "normal"}
            onChange={(evt) => onSetPyCompat(evt.target.value == "pycompat")}
          >
            <option value="pycompat">pycompat enabled</option>
            <option value="normal">pycompat disabled</option>
          </select>
        </div>
        <AceEditor
          mode="nunjucks"
          theme="cobalt"
          fontSize={FONT_SIZE}
          showPrintMargin={false}
          showGutter={true}
          onChange={(newValue) => {
            onTemplateChange(newValue);
          }}
          onSelectionChange={(selection) => {
                  const x = {
                    start_line: selection.anchor.row,
                    start_col: selection.anchor.column,
                    end_line: selection.cursor.row,
                    end_col: selection.cursor.column,
                  };
                  if (selection.anchor.row == selection.cursor.row &&
                      selection.anchor.column == selection.cursor.column) {
                        onTemplateSelection(null);
                        return;
                    }
                  onTemplateSelection(x);
                }
            }
          keyboardHandler={KEYBOARD_HANDLER}
          width="100%"
          height="100%"
          name="templateEditor"
          highlightActiveLine={false}
          onLoad={(editor) => {
            editor.renderer.setPadding(16);
            editor.renderer.setScrollMargin(10);
          }}
          value={template}
          tabSize={TAB_SIZE}
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            useWorker: false
          }}
        />
      </div>
      <div
        style={{
          flex: "1",
          minWidth: "2px",
          maxWidth: "2px",
          background: "black",
          cursor: "ew-resize",
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          setMouseBase(e.pageX);
          setWidthBase(width);
        }}
      />
      <div
        style={{
          flex: "1",
          flexBasis: width + "px",
          flexGrow: "0",
          flexShrink: "0"
        }}
      >
        <AceEditor
          mode="json"
          theme="cobalt"
          fontSize={FONT_SIZE}
          showPrintMargin={false}
          showGutter={false}
          onChange={(newValue) => {
            onTemplateContextChange(newValue);
          }}
          keyboardHandler={KEYBOARD_HANDLER}
          width="100%"
          height="100%"
          name="contextEditor"
          highlightActiveLine={false}
          onLoad={(editor) => {
            editor.container.style.background = "rgb(10, 24, 44)";
            editor.renderer.setPadding(16);
            editor.renderer.setScrollMargin(10);
          }}
          value={templateContext}
          tabSize={TAB_SIZE}
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            useWorker: false
          }}
        />
      </div>
    </div>
  );
};

const OUTPUT_PRE_STYLES = {
  background: "rgb(41, 74, 119)",
  color: "white",
  margin: "0",
  padding: "12px 16px",
  wordWrap: "normal",
  whiteSpace: "pre-wrap",
  fontFamily: "var(--code-font-family)",
  fontSize: "var(--code-font-size)",
};

const OUTPUT_FRAME_WRAPPER_STYLES = {
  height: "100%",
  background: "white",
  margin: "0",
  padding: "0",
  overflow: "hidden",
};

const OUTPUT_FRAME_STYLES = {
  ...OUTPUT_PRE_STYLES,
  background: "white",
  border: "0",
  padding: "0",
  width: "100%",
  height: "100%",
  textFamily: "Verdana, sans-serif",
};

const Error = ({ error }) => {
  return (
    <pre
      style={{
        ...OUTPUT_PRE_STYLES,
        background: "#590523",
        height: "calc(100% - 24px)",
      }}
    >
      {error + ""}
    </pre>
  );
};

// This function is used to parse the AST and extract the inner elements
// and their children. It is used to display the AST in a more readable format.
function parseAst(ast) {
  let result = [];

  if (Object.hasOwn(ast, 'inner')) {
    result.push(ast.inner[1]);

    if (Object.hasOwn(ast.inner[0],'children')) {
      ast.inner[0].children.forEach((child) => {
        result = result.concat(parseAst(child));
      });
    }
  }
  return result;
}


function injectText(template, positions) {
  let placeholder = Array.from("🍆");
  let counter = 0;
  const encoder = new TextEncoder();

  let byteArray = encoder.encode(template);
  let text = [...byteArray];

  for (const p of positions) {
    const placeholderBytes = encoder.encode(placeholder[0]);

    text = [
      ...text.slice(0, p.start_offset + counter),
      ...placeholderBytes,
      ...text.slice(p.start_offset + counter),
    ];

    counter += placeholderBytes.length;
  }

  const decoder = new TextDecoder("utf-8");
  template = decoder.decode(new Uint8Array(text));

  console.log("template", template);
  return template;
}
const RenderOutput = ({ mode, html, renderTemplate, pyCompat, template, templateContext }) => {
  const templateName = `template.${mode}`;
  let result;
  if (renderTemplate) {
    result = template;
  }
  else {
    try {
      result = wasm
        .create_env(
          {
            [templateName]: template,
          },
          pyCompat
        )
        .render(templateName, JSON.parse(templateContext));
    } catch (err) {
      return <Error error={err} />;
    }
  }
  let ast;
  try {
    ast = wasm.parse(template);
    let positions = parseAst(ast);
    template = injectText(template, positions);
  } catch (err) {
    return <Error error={err} />;
  }

  result = DEFAULT_INJECT + result;
  if (html) {
    return (
      <div style={OUTPUT_FRAME_WRAPPER_STYLES}>
        <iframe
          style={OUTPUT_FRAME_STYLES}
          sandbox="allow-same-origin allow-scripts"
          srcDoc={(result || "") + ""}
          title="Rendered HTML"
          id="rendered-html"
        >
        </iframe>
      </div>
    );
  } else {
    return <pre style={OUTPUT_PRE_STYLES}>{(result || "") + ""}</pre>;
  }
};

const TokenOutput = ({ template }) => {
  let result;
  try {
    result = wasm.tokenize(template);
  } catch (err) {
    return <Error error={err} />;
  }
  return (
    <table style={{ margin: "12px", maxWidth: "100%" }}>
      {result.map(([token, span]) => {
        return (
          <tr>
            <td>
              <code style={{ fontWeight: "bold", paddingRight: "10px" }}>
                {token.name}
              </code>
            </td>
            <td>
              {token.payload !== undefined && (
                <code style={{ fontWeight: "bold", paddingRight: "10px" }}>
                  {JSON.stringify(token.payload)}
                </code>
              )}
            </td>
            <td>
              <code>{`${span.start_line}:${span.start_col}-${span.end_line}:${span.end_col}`}</code>
            </td>
          </tr>
        );
      })}
    </table>
  );
};

const AstOutput = ({ template }) => {
  let result;
  try {
    result = wasm.parse(template);
  } catch (err) {
    return <Error error={err} />;
  }
  return (
    <pre style={OUTPUT_PRE_STYLES}>{JSON.stringify(result, false, 2)}</pre>
  );
};

const InstructionsOutput = ({ template }) => {
  let result;
  try {
    result = Array.from(wasm.instructions(template).entries());
    result.sort((a, b) => {
      return a[0].localeCompare(b[0]);
    });
  } catch (err) {
    return <Error error={err} />;
  }

  function converter(key, value) {
    if (value instanceof Map) {
      return Object.fromEntries(value.entries());
    } else {
      return value;
    }
  }

  return (
    <table style={{ margin: "12px", maxWidth: "100%" }}>
      {result.map(([blockName, instructions]) => {
        return [
          <tr>
            <th colspan="3" style={{ textAlign: "left" }}>
              {blockName}:
            </th>
          </tr>,
          ...instructions.map((instr, idx) => {
            return (
              <tr>
                <td style={{ paddingRight: "10px" }}>{idx}</td>
                <td>
                  <code style={{ fontWeight: "bold", paddingRight: "10px" }}>
                    {instr.op}
                  </code>
                </td>
                <td>
                  <code>{JSON.stringify(instr.arg, converter)}</code>
                </td>
              </tr>
            );
          }),
        ];
      })}
    </table>
  );
};

const Output = ({ mode, pyCompat, template, templateContext, templateSelection, height }) => {
  const [outputMode, setOutputMode] = useState("render-html");

  var content = template;
  if (outputMode === "render-html" && content) {
    if (templateSelection) {
      var lines = content.split("\n");
      const sub = lines[templateSelection.start_line].substring(templateSelection.start_col, templateSelection.end_col);
      const firstPart = lines[templateSelection.start_line].substring(0, templateSelection.start_col);
      const lastPart = lines[templateSelection.end_line].substring(templateSelection.end_col);
      lines[templateSelection.start_line] = firstPart +`<b>`+ sub +`</b>`+ lastPart;
      content = lines.join("\n");
    }
  }

  return (
    <div
      style={{
        wordWrap: "normal",
        height: `${height}px`,
        overflow: "auto",
      }}
    >
      <select
        style={{
          position: "absolute",
          right: "10px",
          top: `calc(100vh - ${height}px + 12px)`,
          zIndex: 1000,
        }}
        value={outputMode}
        onChange={(evt) => setOutputMode(evt.target.value)}
      >
        <option value="render-html">Rendered HTML</option>
        <option value="render-template">Render Template</option>
        <option value="render">Rendered Text</option>
        <option value="tokens">Tokens</option>
        <option value="ast">AST</option>
        <option value="instructions">Instructions</option>
      </select>
      {(outputMode === "render" || outputMode === "render-html" || outputMode == "render-template") && (
        <RenderOutput
          mode={mode}
          html={outputMode == "render-html" || outputMode == "render-template"}
          renderTemplate={outputMode == "render-template"}
          pyCompat={pyCompat}
          template={content}
          templateContext={templateContext}
        />
      )}
      {outputMode === "tokens" && <TokenOutput template={template} />}
      {outputMode === "ast" && <AstOutput template={template} />}
      {outputMode === "instructions" && (
        <InstructionsOutput template={template} />
      )}
    </div>
  );
};

export function App({}) {
  const [mode, setMode] = useState("html");
  const [pyCompat, setPyCompat] = useState(false);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [editorSelection, setEditorSelection] = useState(null);
  const [templateContext, setTemplateContext] = useState(() =>
    JSON.stringify(DEFAULT_CONTEXT, null, 2)
  );
  const [isDragging, setIsDragging] = useState(false);
  const [mouseBase, setMouseBase] = useState(0);
  const [outputHeightBase, setOutputHeightBase] = useState(0);
  const [outputHeight, setOutputHeight] = useState(() =>
    getSetting("outputHeight", 200)
  );

  // register on window.onmessage event
  window.addEventListener("message", (event) => {
    if (event.data.type === "selection") {
      const { text, rect } = event.data;
      console.log("Selected text:", text);
      console.log("Selection rect:", rect);
    }
  });
  console.log("editorSelection", editorSelection);
  return (
    <div
      onMouseMove={(e) => {
        if (isDragging) {
          const newHeight = outputHeightBase - (e.pageY - mouseBase);
          setOutputHeight(newHeight);
          setSetting("outputHeight", newHeight);
        }
      }}
      onMouseUp={(e) => {
        setIsDragging(false);
        setMouseBase(0);
        setOutputHeightBase(0);
      }}
    >
      <Editor
        template={template}
        templateContext={templateContext}
        onTemplateChange={setTemplate}
        onTemplateContextChange={setTemplateContext}
        onTemplateSelection={setEditorSelection}
        mode={mode}
        pyCompat={pyCompat}
        onSetPyCompat={setPyCompat}
        outputHeight={outputHeight}
      />
      <div
        style={{
          height: "2px",
          background: "black",
          cursor: "ns-resize",
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          setMouseBase(e.pageY);
          setOutputHeightBase(outputHeight);
        }}
      />
      <Output
        mode={mode}
        pyCompat={pyCompat}
        template={template}
        templateContext={templateContext}
        templateSelection={editorSelection}
        height={outputHeight}
      />
    </div>
  );
}
