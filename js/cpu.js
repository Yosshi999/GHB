class Cpu {
  cutBranch(nodes,branches){
    let cuttable = [];    /* Array [Number] */
    for(var i=0; i<branches.length; i++){
      if(branches[i].tag.water){
        cuttable.push(i);
      }
    }
    console.log("now:"+this.calc(nodes));
    if(this.calc(nodes)==0){
      return cuttable[Math.floor(Math.random()*cuttable.length)];
    }
    else {
      for(var i=0; i<cuttable.length; i++){
        // copy nodes
        let imgNodes = {};
        for(var key in nodes){
          imgNodes[key] = {link:[],tag:{earth:nodes[key].tag.earth}};
          for(var l=0; l<nodes[key].link.length; l++){
            imgNodes[key].link.push(nodes[key].link[l]);
          }
        }
          let branchId = cuttable[i];
          let br = branches[branchId];
          for(var j=0; j<imgNodes[br.linkA].link.length; j++){
            if( imgNodes[br.linkA].link[j] == br.linkB ){
              imgNodes[br.linkA].link.splice(j,1);
              break;
            }
          }
          for(var j=0; j<imgNodes[br.linkB].link.length; j++){
            if( imgNodes[br.linkB].link[j] == br.linkA ){
              imgNodes[br.linkB].link.splice(j,1);
              break;
            }
          }
          if(this.calc(imgNodes) == 0){
            console.log("success");
            return branchId;
          }
        }
      }
    return cuttable[Math.floor(Math.random()*cuttable.length)];
  }
  calc(nodes) {
    var work = {};
    work["ground"] = {link:[],value:0};
    // copy links
    for(var key in nodes){
      if(nodes[key].tag.earth){
        for(var l=0; l<nodes[key].link.length; l++){
          // rename links
          work["ground"].link.push(nodes[key].link[l]);

        }
      }
      else {
        work[key] = {link:[],value:0};
        for(var l=0; l<nodes[key].link.length; l++){
          if(nodes[nodes[key].link[l]].tag.earth){
              work[key].link.push("ground");
          }
          else {
            work[key].link.push(nodes[key].link[l]);
          }
        }
      }
    }
    // start from ground
    return this.getValue(work,"","ground");

  }
  getValue(nodes,lastNodeName,currentNodeName) {
    const currentNode = nodes[currentNodeName];
    if( currentNodeName!="ground" && currentNode.link.length==1 ){
      return 0;
    }
    else {
      let S=0;
      for(var i=0; i<currentNode.link.length; i++){
        if(currentNode.link[i]==lastNodeName)continue;
        S ^= (this.getValue(nodes,currentNodeName,currentNode.link[i])+1);
      }
      return S;
    }

  }

}
