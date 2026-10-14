"use client";

interface PlayerNoteFieldProps {
  /** The textarea's id and name. One drawer is open at a time, so each drawer keeps its own. */
  id: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
  /** False when browser storage is blocked and the note lives only in this tab. */
  persistent: boolean;
}

/**
 * The private note on a player: the label, the field, and a counter that says
 * where the note is kept. With storage blocked nothing here says "saved".
 * Every player drawer on the fantasy pages renders this one field.
 */
export function PlayerNoteField({ id, value, maxLength, onChange, persistent }: PlayerNoteFieldProps) {
  return (
    <div className="ffb-field">
      <label htmlFor={id} className="ffb-field-label">
        Private note
      </label>
      <textarea
        id={id}
        name={id}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        placeholder="Handcuff for Hall… target round 6… avoid."
        className="ffb-textarea"
      />
      <p className="ffb-field-count">
        {`${value.length}/${maxLength} · ${persistent ? "saved on this device" : "kept in this tab only"}`}
      </p>
    </div>
  );
}
