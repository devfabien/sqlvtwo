import { ReactElement } from "react";
import { TextInput, TextInputProps, View, StyleSheet } from "react-native";

interface InputProps extends TextInputProps {
  icon?: ReactElement;
}
export default function InputComponent({ icon, ...inputProps }: InputProps) {
  return (
    <View style={styles.container}>
      {icon}
      <TextInput {...inputProps} style={styles.inputStyles} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },

  inputStyles: {
    width: "80%",
  },
});
