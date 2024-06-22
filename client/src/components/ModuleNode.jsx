import React from "react";
import { Handle } from "reactflow";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";

const ModuleNode = ({ data }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <div
        onClick={onOpen}
        className="bg-[#FFFF00] p-2 border-4 rounded-lg border-gray-800 flex justify-center items-center font-pop text-lg font-semibold cursor-pointer text-center w-[10rem] h-[7rem] overflow-hidden"
        style={{ maxHeight: "7rem" }} // Set max height to trigger overflow
      >
        <p className="line-clamp-3">{data.label}</p>
        <Handle
          type="source"
          position="right"
          id="a"
          style={{ background: "#555" }}
        />
        <Handle
          type="target"
          position="left"
          id="b"
          style={{ background: "#555" }}
        />
      </div>
      <Modal
        className="font-pop"
        size="lg"
        isOpen={isOpen}
        onClose={onClose}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          <>
            <ModalHeader className="flex">
              <p>Module Info:</p>
              <p>{data.moduleName}</p>
            </ModalHeader>
            <ModalBody>
              <p className="font-bold">{data.label}</p>
              <p>{data.description}</p>
              <p className="font-semibold">Study Material:</p>
              {data.links &&
                data.links.map((link, index) => (
                  <p key={index} className="">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 mb-[-0.8rem] underline inline-block max-w-full truncate"
                    >
                      {link}
                    </a>
                  </p>
                ))}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={onClose}>
                Go To Course
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModuleNode;
