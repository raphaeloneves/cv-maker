import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ReactNode } from "react";

interface SortableEntryListProps {
  ids: string[];
  onReorder: (ids: string[]) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/** Shared dnd-kit boilerplate (sensors, collision strategy, drag-end →
 * reorder-array logic) for every draggable list in the builder — the
 * section list itself and every repeatable entry list (experience,
 * education, courses, skills, languages, hobbies, references). */
export function SortableEntryList({ ids, onReorder, disabled, className, children }: SortableEntryListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = ids.slice();
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, String(active.id));
    onReorder(next);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {/* `className`, when passed, fully replaces the default layout
         * classes rather than merging with them — Tailwind gives no
         * reliable guarantee that a later `flex-row` in the same class
         * list beats an earlier `flex-col` (e.g. the Hobbies chip list). */}
        <div className={className ?? "flex flex-col gap-2"}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}
