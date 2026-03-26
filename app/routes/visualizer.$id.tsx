import { useLocation } from "react-router";

const VisualizerId = () => {
  const { state } = useLocation();
  const base64Image: string | undefined = state?.base64Image;

  return (
    <div>
      {base64Image ? (
        <img src={base64Image} alt="Uploaded room" />
      ) : (
        <div>No image available</div>
      )}
    </div>
  );
};

export default VisualizerId;