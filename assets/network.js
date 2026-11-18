
(() => {
  const data = JSON.parse(document.getElementById('network-data').textContent);
  const metricSelect = document.getElementById('metric-select');
  const metricTitle = document.getElementById('metric-title');
  const infoBox = document.getElementById('selected-info');
  const names = {
    degree: 'Degree Centrality',
    betweenness: 'Betweenness Centrality',
    eigenvector: 'Eigenvector Centrality'
  };
  const originalNodes = data.nodes;
  const rawValues = (metric) => originalNodes.map(node => Number(node[metric]) || 0);

  function nodeSize(node, metric) {
    const values = rawValues(metric);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const normalized = high === low ? 0.5 : (node[metric] - low) / (high - low);
    return 14 + normalized * 34;
  }

  const nodes = new vis.DataSet(originalNodes.map(node => ({
    ...node,
    size: nodeSize(node, 'degree'),
    title: `${node.label}\nDegree: ${node.degree.toFixed(3)}\nBetweenness: ${node.betweenness.toFixed(3)}\nEigenvector: ${node.eigenvector.toFixed(3)}` 
  })));
  const edges = new vis.DataSet(data.edges);
  const network = new vis.Network(document.getElementById('network'), { nodes, edges }, {
    autoResize: true,
    physics: false,
    interaction: { dragNodes:true, dragView:true, zoomView:true, hover:true },
    nodes: {
      shape: 'dot',
      borderWidth: 1.5,
      color: {
        background: '#4d91c5',
        border: '#ffffff',
        highlight: { background:'#dd9858', border:'#ffffff' }
      },
      font: { size:15, color:'#ffffff' }
    },
    edges: {
      color: { color:'#445566', highlight:'#7297b7' },
      width: 1.4,
      smooth: false
    }
  });

  function displaySelection(nodeId) {
    const node = originalNodes.find(n => n.id === nodeId);
    if (!node) {
      infoBox.textContent = '點選節點可以查看其分數。';
      return;
    }
    infoBox.textContent = `${node.label}｜${names[metricSelect.value]}：${Number(node[metricSelect.value]).toFixed(3)}`;
  }

  // 當點擊節點時，只保留此節點和其直接鄰居，其餘轉為半透明
  function focusNode(selectedNodeId) {
    if (!selectedNodeId) {
      nodes.update(originalNodes.map(node => ({
        id: node.id,
        color: { background: '#4d91c5', border: '#ffffff' },
        font: { color: '#ffffff' }
      })));
      edges.update(data.edges.map(edge => ({
        id: edge.id,
        color: { color: '#445566' }
      })));
      return;
    }

    const connectedNodes = network.getConnectedNodes(selectedNodeId);
    const neighbors = new Set(connectedNodes);
    neighbors.add(selectedNodeId);

    nodes.update(originalNodes.map(node => {
      if (neighbors.has(node.id)) {
        return {
          id: node.id,
          color: { background: node.id === selectedNodeId ? '#dd9858' : '#4d91c5', border: '#ffffff' },
          font: { color: '#ffffff' }
        };
      } else {
        return {
          id: node.id,
          color: { background: 'rgba(77, 145, 197, 0.15)', border: 'rgba(255, 255, 255, 0.15)' },
          font: { color: 'rgba(255, 255, 255, 0.15)' }
        };
      }
    }));

    edges.update(data.edges.map(edge => {
      const isConnected = (edge.from === selectedNodeId || edge.to === selectedNodeId);
      return {
        id: edge.id,
        color: {
          color: isConnected ? '#7297b7' : 'rgba(68, 85, 102, 0.08)'
        }
      };
    }));
  }

  metricSelect.addEventListener('change', () => {
    const metric = metricSelect.value;
    metricTitle.textContent = names[metric];
    nodes.update(originalNodes.map(node => ({ id:node.id, size:nodeSize(node, metric) })));
    const selected = network.getSelectedNodes();
    if (selected.length) displaySelection(selected[0]);
  });

  network.on('selectNode', params => {
    const clickedNodeId = params.nodes[0];
    displaySelection(clickedNodeId);
    focusNode(clickedNodeId);
  });

  network.on('deselectNode', () => {
    displaySelection(null);
    focusNode(null);
  });
})();
