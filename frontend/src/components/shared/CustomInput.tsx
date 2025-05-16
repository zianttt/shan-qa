import TextField from "@mui/material/TextField";

type Props = {
  name: string;
  type: string;
  label: string;
};

function CustomInput(props: Props) {
  return (
    <TextField
      InputLabelProps={{ style: { color: "white" } }}
      name={props.name}
      type={props.type}
      label={props.label}
      InputProps={{
        style: { width: "100%", borderRadius: 10, fontSize: 15, color: "white", marginBottom: 15 },
      }}
      fullWidth
   />
  );
}

export default CustomInput;
