import rdf2h from "rdf2h";
import GraphNode from "rdfgraphnode";
import $rdf from "rdflib";

//returns a promise for the graph
function loadData(uri) {
    window.location.hash = uri;
    function routes() {
        return Array.from(document.getElementsByClassName("route")).map((div) => ({
            'endPoint' : div.getElementsByClassName('sparql-endpoint')[0].value,
            'pattern' : new RegExp(div.getElementsByClassName('uri-pattern')[0].value,"yi"),
            'loadData' : function(uri) {
                console.log("loading "+uri+" with "+this.endPoint);
                let query = `DESCRIBE <${uri}>`;
                return GraphNode.rdfFetch(this.endPoint + "?query=" + encodeURIComponent(query)).then(response =>
                {
                    if (!response.ok) {
                        throw response.status;
                    } else {
                        return response.graph;
                    }
                });
            }
        }));
    }
    let route = routes().find((route) => route.pattern.test(uri));
    if (route) {
        return route.loadData(uri);
    }
    return GraphNode.rdfFetch(uri).then((res) => res.graph);
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
            loadPromises.push(GraphNode.rdfFetch(rus[i].value).then((res) => renderers.addAll(res.graph.statements)));
        };
        let uri = document.getElementById("uri").value;
        loadPromises.push(loadData(uri).then((g) => dataGraph = g));
        Promise.all(loadPromises).catch((e) => alert(e)).then(() => {
            resultsElement.innerHTML = new RDF2h(renderers).render(dataGraph, uri);
            goButton.innerHTML = '<span class="oi oi-chevron-right"></span>';
            let links = Array.from(resultsElement.getElementsByTagName('a'));
            links.forEach((link) => {
                link.onclick = function () {
                    document.getElementById("uri").value = link.href;
                    showResource();
                    return false;
                }
            });
        });
    } catch(e) {
        console.error("Exception processing settings",e);
    }
}

document.getElementById("lookup").onsubmit = () => {
    showResource();
    return false;
};

if (window.location.hash !== "") {
    let uri = window.location.hash.substring(1);
    document.getElementById("uri").value = uri;
    showResource();
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