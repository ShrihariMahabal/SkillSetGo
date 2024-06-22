import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactFlow, { MiniMap, Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import ModuleNode from "./ModuleNode";
import ProjectNode from "./ProjectNode";
import { v4 as uuidv4 } from "uuid";

const RoadmapMain = () => {
  const [roadmapFull, setRoadmapFull] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  useEffect(() => {
    if (roadmapFull.length > 0) {
      generateNodesAndEdges();
    }
  }, [roadmapFull]);

  const fetchRoadmap = async () => {
    const userId = JSON.parse(localStorage.getItem("user_creds"))._id;
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/get_roadmap/${userId}`
      );
      if (response.status === 200) {
        setRoadmapFull(response.data.roadmap.roadmap);
      } else {
        console.log("Error fetching roadmap");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const generateNodesAndEdges = () => {
    const newNodes = [];
    const newEdges = [];
    let yPos = 0;
    const stepX = 300;
    const stepY = 150;
    let maxSubtopicsCount = 0;

    // Calculate the maximum number of subtopics in any module
    roadmapFull.forEach((module) => {
      if (module.subtopics.length > maxSubtopicsCount) {
        maxSubtopicsCount = module.subtopics.length;
      }
    });

    roadmapFull.forEach((module, moduleIndex) => {
      const subtopicsCount = module.subtopics.length;
      const rowWidth = maxSubtopicsCount * stepX;
      let xPos = -rowWidth / 2 + (maxSubtopicsCount - subtopicsCount) * stepX / 2;

      // Create nodes for subtopics
      module.subtopics.forEach((subtopic, subtopicIndex) => {
        const nodeId = `module-${moduleIndex}-subtopic-${subtopicIndex}`;
        newNodes.push({
          id: nodeId,
          data: { 
            label: subtopic.subtopic, 
            description: subtopic.description,
            links: subtopic.links,
            moduelName: module.module
          },
          position: { x: xPos, y: yPos },
          type: "module",
        });

        if (subtopicIndex > 0) {
          const sourceId = `module-${moduleIndex}-subtopic-${subtopicIndex - 1}`;
          newEdges.push({
            id: `e-${uuidv4()}`,
            source: sourceId,
            target: nodeId,
            animated: true,
            type: 'smoothstep',
            style: { stroke: "#1f2937", strokeWidth: 4, strokeDasharray: "0,0" },
          });
        }

        xPos += stepX;
      });

      // Create node for the project
      const projectId = `module-${moduleIndex}-project`;
      const projectXPos = xPos - stepX;  // Position the project node to the right of the last subtopic node
      newNodes.push({
        id: projectId,
        data: { label: `Project ${moduleIndex + 1}`, project: module.project },
        position: { x: rowWidth / 2, y: yPos + stepY },
        type: "project",
      });

      if (subtopicsCount > 0) {
        const lastSubtopicId = `module-${moduleIndex}-subtopic-${subtopicsCount - 1}`;
        newEdges.push({
          id: `e-${uuidv4()}`,
          source: lastSubtopicId,
          target: projectId,
          sourceHandle: "right",
          targetHandle: "left",
          animated: true,
          type: 'smoothstep',
          style: { stroke: "#1f2937", strokeWidth: 4, strokeDasharray: "0,0" },
        });
      }

      // Connect project node to the first subtopic node of the next module
      if (moduleIndex < roadmapFull.length - 1 && roadmapFull[moduleIndex + 1].subtopics.length > 0) {
        const nextModuleFirstSubtopicId = `module-${moduleIndex + 1}-subtopic-0`;
        newEdges.push({
          id: `e-${uuidv4()}`,
          source: projectId,
          target: nextModuleFirstSubtopicId,
          sourceHandle: "right",
          animated: true,
          type: 'smoothstep',
          style: { stroke: "#1f2937", strokeWidth: 4, strokeDasharray: "0,0" },
        });
      }

      yPos += stepY * 2;
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const nodeTypes = {
    module: ModuleNode,
    project: ProjectNode,
  };

  return (
    <div className="h-screen bg-white w-[80%] ml-[20%]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        zoomOnScroll={false}
        panOnScroll={false}
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={0.8}
      >
        {/* <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'module':
                return '#ffcc00';
              case 'project':
                return '#333333';
              default:
                return '#eee';
            }
          }}
        /> */}
        <Controls />
        {/* <Background color="#aaa" gap={16} /> */}
      </ReactFlow>
    </div>
  );
};

export default RoadmapMain;
