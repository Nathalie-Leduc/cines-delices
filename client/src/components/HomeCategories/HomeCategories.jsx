import categoriesMock from "../../data/categories.mock";
import CategoryCard from "../CategorieCard";
import styles from "./HomeCategories.module.scss";

export default function HomeCategories() {
  return (
    <section className={styles.container}>
      {categoriesMock.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </section>
  );
}