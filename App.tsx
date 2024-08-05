import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SQLite from "expo-sqlite";
import InputComponent from "./src/components/Input";

export default function App() {
  const [todo, setTodo] = useState("");
  const [todoArray, setTodoArray] = useState<any>();

  const db = SQLite.openDatabaseSync("todov2.db");

  useEffect(() => {
    async function setup() {
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, todo TEXT, iscompleted INTEGER DEFAULT 0)`
      );

      const result = await db.getAllAsync(`SELECT * FROM todos`);
      setTodoArray(result);
    }
    setup();
  }, []);

  const addTodo = async () => {
    if (todo.trim().length > 0) {
      await db.runAsync(`INSERT INTO todos (todo) values (?)`, [todo]);
      const updatedResult = await db.getAllAsync(`SELECT * FROM todos`);
      setTodoArray(updatedResult);
      Alert.alert("Todo added");
      setTodo("");
    }
  };

  const updateTodo = async ({ task, id }: any) => {
    await db.runAsync(`UPDATE todos SET todo = ? WHERE id = ?`, [task, id]);
    const updatedResult = await db.getAllAsync(`SELECT * FROM todos`);
    setTodoArray(updatedResult);
    Alert.alert("Todo Updated");
    setTodo("");
  };

  const deleteTodo = async (id: any) => {
    await db.runAsync(`DELETE FROM todos WHERE id=?`, [id]);
    const updatedResult = await db.getAllAsync(`SELECT * FROM todos`);
    setTodoArray(updatedResult);
    Alert.alert("Todo deleted");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View
        style={{
          width: "100%",
          justifyContent: "space-around",
          flexDirection: "row",
          marginTop: 60,
        }}
      >
        <TouchableOpacity style={styles.customButton}>
          <Text style={styles.customText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.customButton}>
          <Text style={styles.customText}>Download</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <InputComponent
          placeholder="Enter text"
          onChangeText={setTodo}
          value={todo}
        />
        <TouchableOpacity style={styles.button} onPress={addTodo}>
          <Text>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginVertical: 10, padding: 10 }}>
        {todoArray
          ? todoArray.map((el: any) => {
              return (
                <View key={el.id} style={styles.dataContainer}>
                  <Text style={styles.dataText}>{el.todo}</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "orange",
                      padding: 7,
                      borderRadius: 8,
                    }}
                    onPress={() => deleteTodo(el.id)}
                  >
                    <Text>Del</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "aqua",
                      padding: 7,
                      borderRadius: 8,
                    }}
                    onPress={() => updateTodo({ task: todo, id: el.id })}
                  >
                    <Text>Upd</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 10,
  },
  inputContainer: {
    marginVertical: 19,
    padding: 5,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 7,
    flexDirection: "row",
    gap: 10,
  },
  inputStyles: {
    width: "80%",
  },
  button: {
    padding: 10,
    borderRadius: 7,
    backgroundColor: "yellow",
  },
  dataContainer: {
    borderTopWidth: 1,
    borderTopColor: "gray",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
  },
  dataText: {
    width: "80%",
  },
  customButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "black",
  },
  customText: {
    color: "white",
  },
});
