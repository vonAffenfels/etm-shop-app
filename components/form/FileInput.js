import {DropZone, Stack, Thumbnail, Caption} from "@shopify/polaris";
import {useState} from "react";

const FileInput = ({label, files, onSelect}) => {

    function handleDropZoneDrop(dropFiles, acceptedFiles, rejectedFiles) {
        if (typeof onSelect === "function") {
            onSelect(acceptedFiles);
        }
    }

    return (
        <>
            <DropZone onDrop={handleDropZoneDrop.bind(this)} allowMultiple={false} label={label}>
                {!files.length && <DropZone.FileUpload actionTitle={"Datei hinzufügen"} actionHint={"oder per Drag und Drop einfügen"} />}
                {(files.length > 0) && (
                    <Stack vertical>
                        {files.map((file, i) => (
                            <Stack alignment="center" key={i}>
                                <Thumbnail
                                    size="small"
                                    alt={file.name}
                                    source={window.URL.createObjectURL(file)}
                                />
                                <div>
                                    {file.name} <Caption>{file.size.toLocaleString()} bytes</Caption>
                                </div>
                            </Stack>
                        ))}
                    </Stack>
                )}
            </DropZone>
        </>
    );
}

export default FileInput;
