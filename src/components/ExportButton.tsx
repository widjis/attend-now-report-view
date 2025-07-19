
import React, { useState } from "react";
import { Button, Menu, MenuItem, CircularProgress } from "@mui/material";
import { Download } from "lucide-react";

interface ExportButtonProps {
  onExport: (format: "csv" | "pdf" | "xlsx") => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  isLoading = false,
  disabled = false,
  className,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: "csv" | "pdf" | "xlsx") => {
    onExport(format);
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        className={className}
        disabled={disabled || isLoading}
        onClick={handleClick}
        startIcon={isLoading ? <CircularProgress size={16} /> : <Download size={16} />}
      >
        {isLoading ? "Exporting..." : "Export"}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleExport("csv")}>
          Export as CSV
        </MenuItem>
        <MenuItem onClick={() => handleExport("xlsx")}>
          Export as Excel
        </MenuItem>
        <MenuItem onClick={() => handleExport("pdf")}>
          Export as PDF
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;
