import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SQLite from "expo-sqlite";
import InputComponent from "./src/components/Input";
import { generateClient } from "aws-amplify/data";
import { Schema } from "./amplify/data/resource";
import outputs from "./amplify_outputs.json";
import { Amplify } from "aws-amplify";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [todo, setTodo] = useState("");
  const [todoArray, setTodoArray] = useState<any>();

  const db = SQLite.openDatabaseSync("todov2.db");

  async function fetchTodos() {
    await db.runAsync(
      `CREATE TABLE IF NOT EXISTS todos (id TEXT PRIMARY KEY, todo TEXT, iscompleted INTEGER DEFAULT 0)`
    );

    const result = await db.getAllAsync(`SELECT * FROM todos`, null);
    setTodoArray(result);
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async () => {
    if (todo.trim().length > 0) {
      await db.runAsync(`INSERT INTO todos (id, todo) values (?,?)`, [
        `${Date.now()}`,
        todo,
      ]);
      const updatedResult = await db.getAllAsync(`SELECT * FROM todos`);
      setTodoArray(updatedResult);
      Alert.alert("Todo added");
      setTodo("");
      const ress = await client.models.Todo.list();
      console.log(ress);
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

  const download = async () => {
    try {
      const localIDS = todoArray.map((todo: any) => ({ id: { ne: todo.id } }));
      const out = await client.models.Todo.list();
      console.log("out: ", JSON.stringify(out, null, 2));
      const { data: todoList } = await client.models.Todo.list({
        filter: {
          or: localIDS,
        },
      });
      await updateLocalDb(todoList);

      Alert.alert("Data Successfully Downloaded");
      const result = await db.getAllAsync(`SELECT * FROM todos`, null);
      setTodoArray(result);
    } catch (error) {
      Alert.alert("Failed to download the error");
      console.log("download error: ", error);
    }
  };

  async function updateLocalDb(todos: any) {
    try {
      for (const todo of todos) {
        const existingTodo = await db.getAllAsync<{
          id: string;
          content: string;
          iscompleted: number;
        }>("SELECT * FROM todos WHERE id = ?", [todo.id]);

        if (existingTodo.length === 0) {
          // Insert new todo
          await db.runAsync(
            "INSERT INTO todos (id, todo, iscompleted) VALUES (?, ?, ?)",
            [todo.id, todo.content, todo.iscompleted]
          );
        } else {
          // Update existing todo
          await db.runAsync(
            "UPDATE todos SET todo = ?, iscompleted = ? WHERE id = ?",
            [todo.content, todo.iscompleted, todo.id]
          );
        }
      }
    } catch (error) {
      console.log("updating localDB error: ", error);
    }
  }

  async function upload() {
    try {
      const { data: todoList } = await client.models.Todo.list();
      const remoteIds = todoList.map((todo) => todo.id);
      const placeholders = remoteIds.map(() => "?").join(",");
      const query = `SELECT * FROM todos WHERE id NOT IN (${placeholders})`;
      const result = await db.getAllAsync(query, remoteIds);
      console.log("placeholders: ", placeholders);
      console.log("result: ", result);
      for (const todo of result) {
        await client.models.Todo.create({
          id: todo.id,
          content: todo.todo,
          iscompleted: todo.iscompleted,
        });
      }
      Alert.alert("Data Successfully Uploaded");
    } catch (error) {
      Alert.alert("Updload failed");
      console.log("upload error: ", error);
    }
  }

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
        <TouchableOpacity style={styles.customButton} onPress={() => upload()}>
          <Text style={styles.customText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.customButton}
          onPress={() => download()}
        >
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
      <ScrollView
        bounces={true}
        showsVerticalScrollIndicator={false}
        style={{ marginVertical: 10, padding: 10 }}
      >
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
      </ScrollView>
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
