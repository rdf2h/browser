import rdf2h from "rdf2h";
import GraphNode from "rdfgraphnode";
import $rdf from "rdflib";

function escapeHtml(str) {
    return str.replace(/[&<>"'\/]/g, function (s) {
      var entityMap = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': '&quot;',
          "'": '&#39;',
          "/": '&#x2F;'
        };

      return entityMap[s];
    });
}

//returns a promise for the graph
function loadData(uri) {
    window.location.hash = uri;
    function checkResponse(response) {
        if (!response.ok) {
            throw "("+response.status+") "+response.statusText;
        } else {
            return response.graph();
        }
    }
    function routes() {
        return Array.from(document.getElementsByClassName("route")).map((div) => ({
            'endPoint' : div.getElementsByClassName('sparql-endpoint')[0].value,
            'pattern' : new RegExp(div.getElementsByClassName('uri-pattern')[0].value,"yi"),
            'loadData' : function(uri) {
                console.log("loading "+uri+" with "+this.endPoint);
                let query = `DESCRIBE <${uri}>`;
                return GraphNode.rdfFetch(this.endPoint + "?query=" + encodeURIComponent(query)).then(r => checkResponse(r));
            }
        }));
    }
    let route = routes().find((route) => route.pattern.test(uri));
    if (route) {
        return route.loadData(uri);
    }
    return GraphNode.rdfFetch(uri).then(r => checkResponse(r));
}

function showResource() {
    let resultsElement = document.getElementById("results");
    let goButton = document.getElementById("go");
    try {
        resultsElement.innerHTML  = '<h5>Please wait until data is loaded.<h5>';
        goButton.innerHTML = '<span class="oi oi-clock"></span>';
        let rus = document.getElementsByClassName("renderer-uri");
        let loadPromises = [];
        let renderers = $rdf.graph();
        let dataGraph;
        for (let i = 0; i < rus.length; i++) {
            loadPromises.push(GraphNode.rdfFetch(rus[i].value).then((res) => res.graph())
            .then((graph) => renderers.addAll(graph.statements)));
        };
        let uri = document.getElementById("uri").value;
        loadPromises.push(loadData(uri).then((g) => dataGraph = g));
        Promise.all(loadPromises).then(() => {
            resultsElement.innerHTML = new RDF2h(renderers).render(dataGraph, uri);
            goButton.innerHTML = '<span class="oi oi-chevron-right"></span>';
            let links = Array.from(resultsElement.getElementsByTagName('a'));
            links.forEach((link) => {
                link.onclick = function () {
                    window.location.hash = link.href;
                    //document.getElementById("uri").value = link.href;
                    //showResource();
                    return false;
                }
            });
        }).catch((e) => {
            resultsElement.innerHTML = '<div class="alert alert-warning" role="alert">' + escapeHtml(e.toString()) + '</div>';
            goButton.innerHTML = '<span class="oi oi-chevron-right"></span>';;
        });
    } catch(e) {
        console.error("Exception processing settings",e);
    }
}

document.getElementById("lookup").onsubmit = () => {
    showResource();
    return false;
};

document.getElementById("example").onclick = function () {
    document.getElementById("uri").value = "http://classifications.data.admin.ch/municipality/1024";
    showResource();
    return false;
}
function setUriFieldFromHash() {
    let uri;    
    if (window.location.hash !== "") {
        uri = window.location.hash.substring(1);
    } else {
        uri = window.location.href + "introducing-rdf2h-browser.ttl";
    }
    if (document.getElementById("uri").value !== uri) {
        document.getElementById("uri").value = uri;
        return true;
    } else {
        return false;
    }
}

setUriFieldFromHash();
showResource();


window.onhashchange = event => {
    console.log("location: "+window.location.href);
    if (setUriFieldFromHash()) {
        showResource();
    }
}

$("#add_route").on("click",() => {
    $("#routes").append('<div class="form-row route"><div class="form-group col-6"><input type="text" class="form-control uri-pattern" placeholder="https://*.example.org"></div><div class="form-group col-6"><input type="text" class="form-control sparql-endpoint" placeholder="https://example.org/sparql"></div></div>');
})

$("#add_renderer").on("click",() => {
    $("#renderers").append('<div class="form-group renderers"><input type="text" class="form-control renderer-uri" placeholder="https://example.org/renderer.ttl"></div>');
})

$('#settings').on('hide.bs.modal', function (e) {
    Array.from(document.getElementsByClassName("renderer-uri")).forEach((ru) => {
        if (ru.value.trim() === "") {
            ru.parentElement.removeChild(ru);
        }
    });
    Array.from(document.getElementsByClassName("route")).forEach((ro) => {
        let uriPattern = ro.getElementsByClassName("uri-pattern")[0].value.trim();
        let sparqlEndpoint = ro.getElementsByClassName("sparql-endpoint")[0].value.trim();
        if ((uriPattern === "") && (sparqlEndpoint === "")){
            ro.parentElement.removeChild(ro);
        }
    });
})