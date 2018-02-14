import rdf2h from "rdf2h";
import GraphNode from "rdfgraphnode";
import $rdf from "rdflib";

//This should load an RDF document using the methods dexcribed in the config
//returns a promise for the graph
function loadData(uri) {
    return GraphNode.rdfFetch(uri).then((res) => res.graph);
}

document.getElementById("lookup").onsubmit = () => {
    let rus = document.getElementsByClassName("renderer-uri");
    let loadPromises = [];
    let renderers = $rdf.graph();
    let dataGraph;
    for (let i = 0; i < rus.length; i++) {
        loadPromises.push(GraphNode.rdfFetch(rus[i].value).then((res) => renderers.addAll(res.graph.statements)));
    };
    let uri = document.getElementById("uri").value;
    loadPromises.push(loadData(uri).then((g) => dataGraph = g));
    Promise.all(loadPromises).then(() => document.getElementById("results").innerHTML = new RDF2h(renderers).render(dataGraph, uri));
    return false;
};
