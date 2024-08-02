import { useEffect, useState } from "react";
import copy from "copy-to-clipboard";

/**
 * @typedef {object} ProviderSelectorProps
 * @prop {import("../App").Provider[]} providers
 * @prop {import("../App").Provider} selectedProvider
 * @prop {(p: import("../App").Provider) => void} setSelectedProvider
 *
 * @param {ProviderSelectorProps} props
 * @returns
 */
function ProviderSelector({
  providers,
  selectedProvider,
  setSelectedProvider,
}) {
  return (
    <>
      <div className="dropdown">
        <button
          className="btn btn-outline-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          {selectedProvider.displayName}
        </button>
        <ul className="dropdown-menu dropdown-menu-start">
          {providers.map((p) => (
            <li key={p.id}>
              <a
                className="dropdown-item"
                href="#"
                onClick={() => setSelectedProvider(p)}
              >
                {p.displayName}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function UrlSelector({ setUrlPath }) {
  const KINDS = [
    {
      id: "file",
      displayName: "File",
      placeholder: "eg. index.ipynb",
      label: "File to open (in JupyterLab)",
      // Using /doc/tree as that opens documents *and* notebook files
      getUrlPath: (input) => `/doc/tree/${input}`,
    },
    {
      id: "url",
      displayName: "URL",
      placeholder: "eg. /rstudio",
      label: "URL to open",
      getUrlPath: (input) => input,
    },
  ];

  const [kind, setKind] = useState(KINDS[0]);
  const [path, setPath] = useState("");

  useEffect(() => {
    if (path) {
      setUrlPath(kind.getUrlPath(path));
    } else {
      setUrlPath("");
    }
  }, [kind, path]);
  return (
    <>
      <label htmlFor="path">{kind.label}</label>
      <div className="input-group">
        <input
          className="form-control"
          type="text"
          name="ref"
          placeholder={kind.placeholder}
          onChange={(e) => setPath(e.target.value)}
        />
        <button
          className="btn btn-outline-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          {kind.displayName}
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          {KINDS.map((k) => (
            <li key={k.id}>
              <a className="dropdown-item" href="#" onClick={() => setKind(k)}>
                {k.displayName}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function makeShareableUrl(publicBaseUrl, provider, repo, ref, urlPath) {
  const url = new URL(`v2/${provider.id}/${repo}/${ref}`, publicBaseUrl);
  if (urlPath) {
    url.searchParams.set("urlpath", urlPath);
  }
  return url;
}

export function LinkGenerator({
  providers,
  publicBaseUrl,
  selectedProvider,
  setSelectedProvider,
  repo,
  setRepo,
  reference,
  setReference,
  urlPath,
  setUrlPath,
  isLaunching,
  setIsLaunching,
}) {
  const [badgeType, setBadgeType] = useState("md"); // Options are md and rst
  const [badgeVisible, setBadgeVisible] = useState(false);

  let launchUrl = "";
  let badgeMarkup = "";

  const ref = reference || selectedProvider.ref.default;
  if (repo !== "" && (!selectedProvider.ref.enabled || ref !== "")) {
    launchUrl = makeShareableUrl(
      publicBaseUrl,
      selectedProvider,
      repo,
      ref,
      urlPath,
    ).toString();
    const badgeLogoUrl = new URL("badge_logo.svg", publicBaseUrl);
    if (badgeType === "md") {
      badgeMarkup = `[![Binder](${badgeLogoUrl})](${launchUrl})`;
    } else {
      badgeMarkup = `.. image:: ${badgeLogoUrl}\n :target: ${launchUrl}`;
    }
  }

  return (
    <>
      <form className="d-flex flex-column gap-3 p-4 pb-0 rounded bg-light">
        <h4>Build and launch a repository</h4>
        <fieldset>
          <label htmlFor="repository">{selectedProvider.repo.label}</label>
          <div className="input-group">
            <ProviderSelector
              providers={providers}
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
            />
            <input
              className="form-control"
              type="text"
              name="repository"
              placeholder={selectedProvider.repo.placeholder}
              disabled={isLaunching}
              // value={repo}
              onChange={(e) => {
                let repo = e.target.value;
                if (selectedProvider.detect && selectedProvider.detect.regex) {
                  // repo value *must* be detected by this regex, or it is not valid yet
                  const re = new RegExp(selectedProvider.detect.regex);
                  const results = re.exec(repo);
                  if (
                    results !== null &&
                    results.groups &&
                    results.groups.repo
                  ) {
                    setRepo(results.groups.repo);
                  }
                } else {
                  setRepo(e.target.value);
                }
              }}
            />
          </div>
        </fieldset>

        <div className="row">
          <fieldset className="col-5">
            <label htmlFor="ref">Git ref (branch, tag, or commit)</label>
            <div className="input-group">
              <input
                className="form-control"
                type="text"
                name="ref"
                disabled={!selectedProvider.ref.enabled || isLaunching}
                placeholder={
                  (selectedProvider.ref.enabled &&
                    selectedProvider.ref.default) ||
                  ""
                }
                onChange={(e) => {
                  setReference(e.target.value);
                }}
              />
            </div>
          </fieldset>
          <fieldset className="col-5">
            <UrlSelector setUrlPath={setUrlPath} />
          </fieldset>
          <div className="col-2 mt-4">
            <button
              className="btn btn-primary col-2 w-100"
              disabled={isLaunching}
              onClick={() => setIsLaunching(true)}
            >
              {isLaunching ? "launching..." : "launch"}
            </button>
          </div>
        </div>

        <div>
          <fieldset>
            <div className="input-group">
              <input
                className="form-control font-monospace"
                disabled
                type="text"
                value={launchUrl}
                placeholder="Fill in the fields to see a URL for sharing your Binder."
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                id="copy-url"
                onClick={() => copy(launchUrl)}
                disabled={launchUrl === ""}
              >
                <i className="ba-copy"></i>
              </button>
            </div>
          </fieldset>
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-baseline">
            <span className="flex-fill">Badges for your README</span>
            <button
              className="btn btn-link"
              type="button"
              aria-controls="badge-container"
              onClick={() => {
                setBadgeVisible(!badgeVisible);
              }}
            >
              {badgeVisible ? "hide" : "show"}
            </button>
          </div>
          <div
            className={`card-body ${badgeVisible ? "" : "d-none"}`}
            id="badge-container"
          >
            <fieldset>
              <div className="input-group">
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Basic radio toggle button group"
                >
                  <input
                    type="radio"
                    className="btn-check"
                    name="btn-badge"
                    id="btn-badge-md"
                    defaultChecked={true}
                    autoComplete="off"
                    onClick={() => setBadgeType("md")}
                  ></input>
                  <label
                    title="markdown"
                    className="btn btn-outline-secondary"
                    htmlFor="btn-badge-md"
                  >
                    md
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="btn-badge"
                    id="btn-badge-rst"
                    autoComplete="off"
                    onClick={() => setBadgeType("rst")}
                  ></input>
                  <label
                    title="reStructuredText"
                    className="btn btn-outline-secondary"
                    htmlFor="btn-badge-rst"
                  >
                    rST
                  </label>
                </div>
                <input
                  className="form-control font-monospace"
                  disabled
                  type="text"
                  value={badgeMarkup}
                  placeholder="Fill in the fields to see a badge markup for your README."
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  id="copy-url"
                  onClick={() => copy(badgeMarkup)}
                  disabled={badgeMarkup === ""}
                >
                  <i className="ba-copy"></i>
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      </form>
    </>
  );
}
