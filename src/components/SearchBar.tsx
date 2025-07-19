
import React, { useState } from "react";
import { TextField, Button, InputAdornment, Box } from "@mui/material";
import { Search } from "lucide-react";

interface SearchBarProps {
  initialValue: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialValue,
  onSearch,
  placeholder = "Search by name, department, card number...",
  className,
}) => {
  const [searchValue, setSearchValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 2 }}>
      <TextField
        id="search-field"
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={placeholder}
        fullWidth
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} />
            </InputAdornment>
          ),
        }}
      />
      <Button type="submit" variant="contained">
        Search
      </Button>
    </Box>
  );
};

export default SearchBar;
