import rdf2h from "rdf2h";
import GraphNode from "rdfgraphnode";
import $rdf from "rdflib";

//This should load an RDF document using the methods dexcribed in the config
//returns a promise for the graph
function loadData(uri) {
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

document.getElementById("lookup").onsubmit = () => {
    try {
        let rus = document.getElementsByClassName("renderer-uri");
        let loadPromises = [];
        let renderers = $rdf.graph();
        let dataGraph;
        for (let i = 0; i < rus.length; i++) {
            loadPromises.push(GraphNode.rdfFetch(rus[i].value).then((res) => renderers.addAll(res.graph.statements)));
        };
        let uri = document.getElementById("uri").value;
        loadPromises.push(loadData(uri).then((g) => dataGraph = g));
        Promise.all(loadPromises).then(() => {
            document.getElementById("results").innerHTML = new RDF2h(renderers).render(dataGraph, uri)
        });
    } catch(e) {
        console.error("Exception processing settings",e);
    }
    return false;
};
